import ImagePicker from 'react-native-image-crop-picker';

// WhatsApp-style profile photo picker: opens the gallery, then a square
// crop screen (drag/zoom to position) before returning the image. Returns
// an asset shaped like react-native-image-picker's asset object so callers
// don't need to change their upload/FormData code, or null if the user
// cancelled at any step (gallery or crop screen).
export async function pickCroppedImage({ circle = true, size = 600 } = {}) {
  try {
    const image = await ImagePicker.openPicker({
      width: size,
      height: size,
      cropping: true,
      cropperCircleOverlay: circle,
      freeStyleCropEnabled: false,
      mediaType: 'photo',
      compressImageQuality: 0.85,
      compressImageMaxWidth: size,
      compressImageMaxHeight: size,
      cropperToolbarTitle: 'Adjust Photo',
    });
    return {
      uri: image.path,
      type: image.mime || 'image/jpeg',
      fileName: image.filename || `photo-${Date.now()}.jpg`,
      fileSize: image.size,
    };
  } catch (err) {
    if (err?.code === 'E_PICKER_CANCELLED') return null;
    throw err;
  }
}
