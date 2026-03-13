// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { jsPDF } from 'jspdf';

export const dynamic = 'force-dynamic';

// GET - Generate PDF for B2B invoice and return as base64
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const invoice = await prisma.b2b_invoices.findUnique({
      where: { id: params.id },
      include: {
        booking: {
          include: {
            customer: {
              select: { id: true, name: true, email: true, phone: true, companyName: true, gstin: true }
            },
            trips: {
              select: {
                id: true, tripCode: true, status: true, vehicleName: true, vehicleNumber: true, driverName: true, driverPhone: true,
                vehicle: {
                  select: {
                    vehicleName: true, registrationNumber: true,
                    vehicle_models: { select: { name: true } },
                    brands: { select: { name: true } },
                  }
                },
                driver: { select: { name: true, phone: true } },
                vendor: { select: { businessName: true } },
              }
            },
          }
        },
        generatedBy: { select: { name: true } },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const booking = invoice.booking;
    const trips = booking?.trips || [];

    // Create PDF using jsPDF
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 0;

    // Header background
    doc.setFillColor(13, 148, 136); // teal-600
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Header text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 15, 18);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('TransRentals', 15, 26);
    doc.setFontSize(9);
    doc.text(invoice.invoiceNumber || '', 15, 33);

    // Status badge on right
    const statusText = invoice.status || 'PENDING';
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(statusText, pageWidth - 15, 20, { align: 'right' });

    // Date on right
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const invoiceDate = invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
    doc.text(`Date: ${invoiceDate}`, pageWidth - 15, 28, { align: 'right' });
    if (invoice.dueDate) {
      const dueDate = new Date(invoice.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      doc.text(`Due: ${dueDate}`, pageWidth - 15, 34, { align: 'right' });
    }

    y = 50;

    // Bill To section
    doc.setTextColor(107, 114, 128); // gray-500
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO', 15, y);
    y += 6;

    doc.setTextColor(31, 41, 55); // gray-800
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.companyName || booking?.companyName || '-', 15, y);
    y += 5;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    if (invoice.customerEmail) { doc.text(invoice.customerEmail, 15, y); y += 4; }
    if (invoice.customerPhone) { doc.text(invoice.customerPhone, 15, y); y += 4; }
    if (invoice.gstin) { doc.text(`GSTIN: ${invoice.gstin}`, 15, y); y += 4; }

    // Booking details on right
    const rightX = pageWidth - 15;
    let ry = 50;
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('BOOKING DETAILS', rightX, ry, { align: 'right' });
    ry += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 41, 55);
    if (booking?.bookingNumber) { doc.text(`Booking: ${booking.bookingNumber}`, rightX, ry, { align: 'right' }); ry += 4; }
    if (booking?.serviceType) { doc.text(`Service: ${booking.serviceType.replace(/-/g, ' ').toUpperCase()}`, rightX, ry, { align: 'right' }); ry += 4; }
    if (booking?.pickupLocation) { doc.text(`From: ${booking.pickupLocation.substring(0, 30)}`, rightX, ry, { align: 'right' }); ry += 4; }
    if (booking?.dropLocation) { doc.text(`To: ${booking.dropLocation.substring(0, 30)}`, rightX, ry, { align: 'right' }); ry += 4; }

    y = Math.max(y, ry) + 8;

    // Separator line
    doc.setDrawColor(229, 231, 235);
    doc.line(15, y, pageWidth - 15, y);
    y += 8;

    // Trips table
    if (trips.length > 0) {
      doc.setTextColor(107, 114, 128);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('TRIP DETAILS', 15, y);
      y += 6;

      // Table header
      doc.setFillColor(249, 250, 251); // gray-50
      doc.rect(15, y - 3, pageWidth - 30, 8, 'F');
      doc.setFontSize(7);
      doc.setTextColor(107, 114, 128);
      doc.text('#', 18, y + 2);
      doc.text('TRIP CODE', 28, y + 2);
      doc.text('VEHICLE', 65, y + 2);
      doc.text('REG. NO', 110, y + 2);
      doc.text('DRIVER', 140, y + 2);
      doc.text('STATUS', 175, y + 2);
      y += 10;

      // Table rows
      trips.forEach((trip, i) => {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }
        const vehName = trip.vehicleName || trip.vehicle?.vehicleName
          || [trip.vehicle?.brands?.name, trip.vehicle?.vehicle_models?.name].filter(Boolean).join(' ')
          || booking?.serviceType?.replace(/-/g, ' ') || '-';
        const vehNumber = trip.vehicleNumber || trip.vehicle?.registrationNumber || '-';
        const drvName = trip.driverName || trip.driver?.name || '-';

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(75, 85, 99);
        doc.text(`${i + 1}`, 18, y);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(31, 41, 55);
        doc.text(trip.tripCode || '-', 28, y);
        doc.setFont('helvetica', 'normal');
        doc.text(vehName.substring(0, 25), 65, y);
        doc.setTextColor(75, 85, 99);
        doc.text(vehNumber, 110, y);
        doc.text(drvName.substring(0, 18), 140, y);

        // Status color
        const statusColor = trip.status === 'COMPLETED' ? [5, 150, 105] : trip.status === 'STARTED' ? [37, 99, 235] : trip.status === 'CANCELLED' ? [220, 38, 38] : [107, 114, 128];
        doc.setTextColor(...statusColor);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text(trip.status || '-', 175, y);
        y += 7;
      });

      y += 5;
      doc.setDrawColor(229, 231, 235);
      doc.line(15, y, pageWidth - 15, y);
      y += 8;
    }

    // Amount section
    if (y > 230) { doc.addPage(); y = 20; }

    doc.setTextColor(107, 114, 128);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT SUMMARY', 15, y);
    y += 8;

    const amountX = pageWidth - 15;
    const labelX = pageWidth - 70;

    // Base amount
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 85, 99);
    doc.text('Base Amount', labelX, y);
    doc.text(`Rs. ${(invoice.baseAmount || 0).toLocaleString('en-IN')}`, amountX, y, { align: 'right' });
    y += 6;

    // GST
    if (invoice.gstAmount) {
      doc.text(`GST (${invoice.gstPercent || 5}%)`, labelX, y);
      doc.text(`Rs. ${invoice.gstAmount.toLocaleString('en-IN')}`, amountX, y, { align: 'right' });
      y += 6;
    }

    // Total
    doc.setDrawColor(13, 148, 136);
    doc.line(labelX, y, amountX, y);
    y += 6;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(13, 148, 136);
    doc.text('Total Amount', labelX, y);
    doc.text(`Rs. ${(invoice.totalAmount || 0).toLocaleString('en-IN')}`, amountX, y, { align: 'right' });
    y += 10;

    // Payment status
    if (invoice.status === 'PAID' && invoice.paidAt) {
      doc.setFillColor(236, 253, 245); // green-50
      doc.rect(15, y - 3, pageWidth - 30, 12, 'F');
      doc.setTextColor(5, 150, 105);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      const paidDate = new Date(invoice.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      doc.text(`PAID on ${paidDate}`, 20, y + 4);
      if (invoice.transactionRef) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(`Ref: ${invoice.transactionRef}`, amountX, y + 4, { align: 'right' });
      }
    }

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 15;
    doc.setTextColor(156, 163, 175);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('TransRentals - B2B Invoice', 15, footerY);
    doc.text('www.transrentals.in', amountX, footerY, { align: 'right' });

    // Check if client wants base64 JSON or direct binary
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    const filename = `Invoice_${invoice.invoiceNumber || invoice.id}.pdf`;

    if (format === 'base64') {
      const pdfBase64 = pdfBuffer.toString('base64');
      return NextResponse.json({
        status: 'success',
        pdf: pdfBase64,
        filename,
      });
    }

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdfBuffer.length),
      },
    });
  } catch (error: any) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
