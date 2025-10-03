import {
  launchCamera,
  launchImageLibrary,
  ImagePickerResponse,
  CameraOptions,
  ImageLibraryOptions,
} from 'react-native-image-picker';
import { PermissionsAndroid, Platform } from 'react-native';

/**
 * Pure React Native Image Picker Service
 * Replaces expo-image-picker with react-native-image-picker
 */

export interface ImagePickerResult {
  uri: string;
  type: string;
  fileName: string;
  fileSize: number;
  width?: number;
  height?: number;
  base64?: string;
  cancelled: boolean;
}

class ImagePickerServiceRN {
  /**
   * Request camera permissions (Android only)
   */
  async requestCameraPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'This app needs access to your camera',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (error) {
        console.error('❌ Failed to request camera permission:', error);
        return false;
      }
    }
    return true; // iOS handles permissions in Info.plist
  }

  /**
   * Pick image from library
   */
  async pickImage(options?: {
    allowsEditing?: boolean;
    quality?: number;
    mediaTypes?: 'Images' | 'Videos' | 'All';
    base64?: boolean;
  }): Promise<ImagePickerResult | null> {
    try {
      const pickerOptions: ImageLibraryOptions = {
        mediaType: options?.mediaTypes === 'Videos' ? 'video' :
                  options?.mediaTypes === 'All' ? 'mixed' : 'photo',
        quality: options?.quality || 1,
        includeBase64: options?.base64 || false,
        selectionLimit: 1,
      };

      const result: ImagePickerResponse = await launchImageLibrary(pickerOptions);

      if (result.didCancel) {
        console.log('User cancelled image picker');
        return {
          uri: '',
          type: '',
          fileName: '',
          fileSize: 0,
          cancelled: true,
        };
      }

      if (result.errorCode || result.errorMessage) {
        console.error('Image picker error:', result.errorMessage);
        return null;
      }

      const asset = result.assets?.[0];
      if (!asset) {
        return null;
      }

      return {
        uri: asset.uri || '',
        type: asset.type || 'image/jpeg',
        fileName: asset.fileName || 'image.jpg',
        fileSize: asset.fileSize || 0,
        width: asset.width,
        height: asset.height,
        base64: asset.base64,
        cancelled: false,
      };
    } catch (error) {
      console.error('❌ Failed to pick image:', error);
      return null;
    }
  }

  /**
   * Take photo with camera
   */
  async takePhoto(options?: {
    allowsEditing?: boolean;
    quality?: number;
    base64?: boolean;
  }): Promise<ImagePickerResult | null> {
    try {
      // Request camera permission
      const hasPermission = await this.requestCameraPermission();
      if (!hasPermission) {
        console.error('❌ Camera permission not granted');
        return null;
      }

      const cameraOptions: CameraOptions = {
        mediaType: 'photo',
        quality: options?.quality || 1,
        includeBase64: options?.base64 || false,
        saveToPhotos: true,
      };

      const result: ImagePickerResponse = await launchCamera(cameraOptions);

      if (result.didCancel) {
        console.log('User cancelled camera');
        return {
          uri: '',
          type: '',
          fileName: '',
          fileSize: 0,
          cancelled: true,
        };
      }

      if (result.errorCode || result.errorMessage) {
        console.error('Camera error:', result.errorMessage);
        return null;
      }

      const asset = result.assets?.[0];
      if (!asset) {
        return null;
      }

      return {
        uri: asset.uri || '',
        type: asset.type || 'image/jpeg',
        fileName: asset.fileName || 'photo.jpg',
        fileSize: asset.fileSize || 0,
        width: asset.width,
        height: asset.height,
        base64: asset.base64,
        cancelled: false,
      };
    } catch (error) {
      console.error('❌ Failed to take photo:', error);
      return null;
    }
  }

  /**
   * Pick multiple images
   */
  async pickMultipleImages(options?: {
    quality?: number;
    base64?: boolean;
    limit?: number;
  }): Promise<ImagePickerResult[]> {
    try {
      const pickerOptions: ImageLibraryOptions = {
        mediaType: 'photo',
        quality: options?.quality || 1,
        includeBase64: options?.base64 || false,
        selectionLimit: options?.limit || 10,
      };

      const result: ImagePickerResponse = await launchImageLibrary(pickerOptions);

      if (result.didCancel || !result.assets) {
        return [];
      }

      return result.assets.map(asset => ({
        uri: asset.uri || '',
        type: asset.type || 'image/jpeg',
        fileName: asset.fileName || 'image.jpg',
        fileSize: asset.fileSize || 0,
        width: asset.width,
        height: asset.height,
        base64: asset.base64,
        cancelled: false,
      }));
    } catch (error) {
      console.error('❌ Failed to pick multiple images:', error);
      return [];
    }
  }

  /**
   * Request media library permissions
   */
  async requestMediaLibraryPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const permission = Platform.Version >= 33
          ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
          : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

        const granted = await PermissionsAndroid.request(permission, {
          title: 'Media Library Permission',
          message: 'This app needs access to your photos',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        });

        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (error) {
        console.error('❌ Failed to request media library permission:', error);
        return false;
      }
    }
    return true; // iOS handles permissions in Info.plist
  }

  /**
   * Get permissions status
   */
  async getPermissionsStatus(): Promise<{
    camera: boolean;
    mediaLibrary: boolean;
  }> {
    const cameraPermission = await this.requestCameraPermission();
    const mediaLibraryPermission = await this.requestMediaLibraryPermissions();

    return {
      camera: cameraPermission,
      mediaLibrary: mediaLibraryPermission,
    };
  }
}

export const imagePickerServiceRN = new ImagePickerServiceRN();
export default imagePickerServiceRN;
