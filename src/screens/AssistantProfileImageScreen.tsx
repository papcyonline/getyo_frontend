import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { RootStackParamList } from '../types';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import ApiService from '../services/api';
import { setUser } from '../store/slices/userSlice';
import { RootState } from '../store';

const { height } = Dimensions.get('window');

type AssistantProfileImageNavigationProp = StackNavigationProp<RootStackParamList, 'AssistantProfileImage'>;

const AssistantProfileImageScreen: React.FC = () => {
  const navigation = useNavigation<AssistantProfileImageNavigationProp>();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.user.user);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();

    loadExistingImage();
  }, []);

  useEffect(() => {
    setHasChanges(profileImage !== originalImage);
  }, [profileImage, originalImage]);

  const loadExistingImage = async () => {
    try {
      setLoading(true);

      // Load existing assistant configuration
      const response = await ApiService.getAssistantSetup();
      if (response?.data?.assistantProfileImage) {
        setProfileImage(response.data.assistantProfileImage);
        setOriginalImage(response.data.assistantProfileImage);
      }
    } catch (error: any) {
      console.error('Failed to load assistant profile image:', error);
      // Don't show error for first-time users
    } finally {
      setLoading(false);
    }
  };

  const handleChangePhoto = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photos to change your assistant\'s profile picture.'
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleRemovePhoto = () => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove your assistant\'s profile photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => setProfileImage(null),
        },
      ]
    );
  };

  const handleSave = async () => {
    try {
      setUploading(true);

      // Upload profile image if changed
      if (profileImage && profileImage !== originalImage) {
        console.log('📤 Uploading profile image:', profileImage);
        const response = await ApiService.updateAssistantProfileImage(profileImage);
        console.log('✅ Upload response:', response);

        setOriginalImage(profileImage);

        // Update Redux store immediately with the new profile image
        if (response?.data?.assistantProfileImage) {
          console.log('🔄 Updating Redux with new image URL:', response.data.assistantProfileImage);

          // Update the current user object with the new profile image
          if (currentUser) {
            const updatedUser = {
              ...currentUser,
              assistantProfileImage: response.data.assistantProfileImage,
            };
            dispatch(setUser(updatedUser));
            console.log('✅ Redux updated successfully');
          }
        }

        Alert.alert(
          'Success',
          'Assistant profile image updated successfully!',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else if (!profileImage && originalImage) {
        // Handle removal case if needed
        Alert.alert('Info', 'Profile image removed.');
        navigation.goBack();
      } else {
        navigation.goBack();
      }
    } catch (error: any) {
      console.error('❌ Failed to update assistant profile image:', error);
      Alert.alert(
        'Update Failed',
        error.message || 'Unable to update your assistant\'s profile image. Please try again.',
        [
          { text: 'Retry', onPress: handleSave },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } finally {
      setUploading(false);
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Assistant Profile</Text>
          <Text style={styles.subtitle}>
            Set your assistant's photo
          </Text>
        </View>

        <Animated.View
          style={[
            styles.animatedContainer,
            {
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.slidingContainer}>
            <View style={styles.topBar}>
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Ionicons name="chevron-back" size={24} color="#C9A96E" />
              </TouchableOpacity>
              <Text style={styles.step}>Profile Settings</Text>
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#C9A96E" />
                  <Text style={styles.loadingText}>Loading profile image...</Text>
                </View>
              ) : (
                <>
                  {/* Profile Image Display */}
                  <View style={styles.imageSection}>
                    <View style={styles.avatarContainer}>
                      {profileImage ? (
                        <Image
                          source={{ uri: profileImage }}
                          style={styles.avatar}
                        />
                      ) : (
                        <View style={[styles.avatar, styles.placeholderAvatar]}>
                          <Ionicons name="person" size={60} color="rgba(201, 169, 110, 0.4)" />
                        </View>
                      )}
                    </View>

                    <Text style={styles.imageLabel}>
                      {profileImage ? 'Current Profile Image' : 'No Profile Image Set'}
                    </Text>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={handleChangePhoto}
                      disabled={uploading}
                    >
                      <View style={styles.actionButtonContent}>
                        <View style={styles.iconWrapper}>
                          <Ionicons name="camera" size={24} color="#C9A96E" />
                        </View>
                        <View style={styles.actionTextContainer}>
                          <Text style={styles.actionTitle}>
                            {profileImage ? 'Change Photo' : 'Add Photo'}
                          </Text>
                          <Text style={styles.actionDescription}>
                            Choose from your photo library
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="rgba(255, 247, 245, 0.4)" />
                      </View>
                    </TouchableOpacity>

                    {profileImage && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.removeButton]}
                        onPress={handleRemovePhoto}
                        disabled={uploading}
                      >
                        <View style={styles.actionButtonContent}>
                          <View style={[styles.iconWrapper, styles.removeIconWrapper]}>
                            <Ionicons name="trash-outline" size={24} color="#EF4444" />
                          </View>
                          <View style={styles.actionTextContainer}>
                            <Text style={[styles.actionTitle, styles.removeText]}>
                              Remove Photo
                            </Text>
                            <Text style={styles.actionDescription}>
                              Use default avatar instead
                            </Text>
                          </View>
                          <Ionicons name="chevron-forward" size={20} color="rgba(255, 247, 245, 0.4)" />
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Info Section */}
                  <View style={styles.infoSection}>
                    <View style={styles.infoItem}>
                      <Ionicons name="information-circle-outline" size={20} color="rgba(255, 247, 245, 0.6)" />
                      <Text style={styles.infoText}>
                        This image will appear in chat conversations and assistant settings
                      </Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Ionicons name="shield-checkmark-outline" size={20} color="rgba(255, 247, 245, 0.6)" />
                      <Text style={styles.infoText}>
                        Your assistant's image is private and only visible to you
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (!hasChanges || uploading) && styles.disabledButton
                ]}
                onPress={handleSave}
                disabled={!hasChanges || uploading}
                activeOpacity={0.7}
              >
                {uploading ? (
                  <View style={styles.savingContainer}>
                    <ActivityIndicator size="small" color="#000000" style={{ marginRight: 8 }} />
                    <Text style={styles.saveButtonText}>Uploading...</Text>
                  </View>
                ) : (
                  <Text style={[
                    styles.saveButtonText,
                    !hasChanges && styles.disabledButtonText
                  ]}>
                    Save Changes
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
  },
  animatedContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 30,
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#C9A96E',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(201, 169, 110, 0.7)',
    textAlign: 'center',
    fontWeight: '400',
    lineHeight: 24,
  },
  slidingContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 247, 245, 0.1)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 25,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(201, 169, 110, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 110, 0.2)',
  },
  step: {
    fontSize: 14,
    color: '#C9A96E',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 30,
    paddingTop: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255, 247, 245, 0.7)',
    marginTop: 16,
    fontWeight: '500',
  },
  imageSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  placeholderAvatar: {
    backgroundColor: 'rgba(255, 247, 245, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 247, 245, 0.2)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageLabel: {
    fontSize: 16,
    color: 'rgba(255, 247, 245, 0.7)',
    fontWeight: '500',
  },
  actionButtons: {
    marginTop: 20,
    gap: 12,
  },
  actionButton: {
    backgroundColor: 'rgba(255, 247, 245, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 247, 245, 0.1)',
  },
  removeButton: {
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(201, 169, 110, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  removeIconWrapper: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF7F5',
    marginBottom: 4,
  },
  removeText: {
    color: '#EF4444',
  },
  actionDescription: {
    fontSize: 14,
    color: 'rgba(255, 247, 245, 0.6)',
  },
  infoSection: {
    marginTop: 30,
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255, 247, 245, 0.6)',
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 30,
    paddingBottom: 40,
    paddingTop: 20,
  },
  saveButton: {
    height: 65,
    backgroundColor: '#C9A96E',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 247, 245, 0.1)',
  },
  saveButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 0.5,
  },
  disabledButtonText: {
    color: 'rgba(255, 247, 245, 0.4)',
  },
  savingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AssistantProfileImageScreen;
