'use client';

import { CheckCircle2, Circle, AlertCircle, FileText, MapPin, Wrench } from 'lucide-react';
import Link from 'next/link';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'completed' | 'pending' | 'in-progress';
  action?: {
    label: string;
    href: string;
  };
}

interface VendorOnboardingProps {
  vendorStatus: string;
  documentsCount: number;
  locationRequestsCount: number;
  serviceRequestsCount: number;
}

export default function VendorOnboarding({
  vendorStatus,
  documentsCount,
  locationRequestsCount,
  serviceRequestsCount,
}: VendorOnboardingProps) {
  // Determine step statuses based on vendor data
  const steps: OnboardingStep[] = [
    {
      id: 'documents',
      title: 'Upload Documents',
      description: 'Complete your profile by uploading all required business documents including GST, PAN, and business registration certificates.',
      icon: <FileText className="w-6 h-6" />,
      status: documentsCount > 0 ? 'completed' : 'in-progress', // Always enabled - first step
      action: {
        label: documentsCount > 0 ? 'View Documents' : 'Upload Documents',
        href: '/vendor/documents',
      },
    },
    {
      id: 'locations',
      title: 'Request Service Locations',
      description: 'Request access to locations where you want to provide your services. Admin will review and approve your location requests.',
      icon: <MapPin className="w-6 h-6" />,
      status: locationRequestsCount > 0 ? 'completed' : documentsCount > 0 ? 'in-progress' : 'pending',
      action: {
        label: locationRequestsCount > 0 ? 'View Requests' : 'Request Locations',
        href: '/vendor/locations',
      },
    },
    {
      id: 'services',
      title: 'Request Services',
      description: 'Request the services you want to offer. Admin will review your experience and approve the service requests.',
      icon: <Wrench className="w-6 h-6" />,
      status: serviceRequestsCount > 0 ? 'completed' : locationRequestsCount > 0 ? 'in-progress' : 'pending',
      action: {
        label: serviceRequestsCount > 0 ? 'View Requests' : 'Request Services',
        href: '/vendor/services',
      },
    },
  ];

  const completedSteps = steps.filter((step) => step.status === 'completed').length;
  const progressPercentage = (completedSteps / steps.length) * 100;
  const allStepsCompleted = completedSteps === steps.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-4">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Welcome to Your Vendor Dashboard
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Complete the following steps to get your account approved and start receiving bookings
          </p>
        </div>

        {/* Status Banner */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className={`w-6 h-6 ${allStepsCompleted ? 'text-yellow-600' : 'text-blue-600'}`} />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Account Status</h2>
                <p className="text-sm text-gray-600">
                  {allStepsCompleted
                    ? 'All steps completed! Your details are under review.'
                    : vendorStatus === 'PENDING' && 'Your account is pending approval'}
                  {!allStepsCompleted && vendorStatus === 'DOCUMENTS_PENDING' && 'Please complete document upload'}
                  {!allStepsCompleted && vendorStatus === 'UNDER_REVIEW' && 'Your account is under review'}
                </p>
              </div>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${
                allStepsCompleted
                  ? 'bg-yellow-100 text-yellow-800'
                  : vendorStatus === 'UNDER_REVIEW'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {allStepsCompleted ? 'UNDER REVIEW' : vendorStatus.replace('_', ' ')}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Setup Progress: {completedSteps} of {steps.length} steps
              </span>
              <span className={`text-sm font-semibold ${allStepsCompleted ? 'text-green-600' : 'text-blue-600'}`}>
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-3 rounded-full transition-all duration-500 ease-out ${
                  allStepsCompleted
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Under Review Message */}
        {allStepsCompleted && (
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-2xl p-6 mb-8 shadow-md">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-yellow-900 mb-2">
                  ✅ Setup Complete - Under Review
                </h3>
                <p className="text-yellow-800 mb-3">
                  Great job! You've completed all the required steps. Our admin team is reviewing your:
                </p>
                <ul className="space-y-2 text-sm text-yellow-700">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-yellow-600" />
                    <span>Business documents</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-yellow-600" />
                    <span>Location requests</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-yellow-600" />
                    <span>Service requests</span>
                  </li>
                </ul>
                <p className="text-yellow-800 mt-4 font-medium">
                  📧 You'll receive an email notification once your account is approved. This usually takes 1-2 business days.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`bg-white rounded-2xl shadow-md border-2 transition-all duration-300 ${
                step.status === 'completed'
                  ? 'border-green-200 bg-green-50/30'
                  : step.status === 'in-progress'
                  ? 'border-blue-300 bg-blue-50/30'
                  : 'border-gray-200'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start space-x-4">
                  {/* Step Icon */}
                  <div
                    className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center ${
                      step.status === 'completed'
                        ? 'bg-green-100 text-green-600'
                        : step.status === 'in-progress'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {step.icon}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-semibold text-gray-500">
                          STEP {index + 1}
                        </span>
                        {step.status === 'completed' && (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        )}
                        {step.status === 'in-progress' && (
                          <Circle className="w-5 h-5 text-blue-600 animate-pulse" />
                        )}
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                      {step.description}
                    </p>

                    {/* Action Button */}
                    {step.action && (
                      <>
                        {step.status === 'pending' ? (
                          <button
                            disabled
                            className="inline-flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-200 bg-gray-100 text-gray-500 cursor-not-allowed opacity-60"
                          >
                            {step.action.label}
                            <svg
                              className="w-5 h-5 ml-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 7l5 5m0 0l-5 5m5-5H6"
                              />
                            </svg>
                          </button>
                        ) : (
                          <Link
                            href={step.action.href}
                            className={`inline-flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                              step.status === 'completed'
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                            }`}
                          >
                            {step.action.label}
                            <svg
                              className="w-5 h-5 ml-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 7l5 5m0 0l-5 5m5-5H6"
                              />
                            </svg>
                          </Link>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">Need Help?</h3>
              <p className="text-blue-100 mb-4">
                Our team is here to assist you with the onboarding process. If you have any
                questions or face any issues, feel free to reach out.
              </p>
              <Link
                href="/vendor/support"
                className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
              >
                Contact Support
                <svg
                  className="w-5 h-5 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
