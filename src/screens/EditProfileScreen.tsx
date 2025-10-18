import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

import { RootState } from '../store';
import { setUser } from '../store/slices/userSlice';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.theme.theme);
  const user = useSelector((state: RootState) => state.user.user);

  const [name, setName] = useState(user?.preferredName || user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileImage, setProfileImage] = useState<string | null>(user?.profileImage || null);
  const [uploading, setUploading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const hasNameChange = name !== (user?.preferredName || user?.name || '');
    const hasEmailChange = email !== (user?.email || '');
    const hasPhoneChange = phone !== (user?.phone || '');
    const hasImageChange = profileImage !== (user?.profileImage || null);

    setHasChanges(hasNameChange || hasEmailChange || hasPhoneChange || hasImageChange);
  }, [name, email, phone, profileImage, user]);

  const handleBackPress = () => {
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

  const handleChangePhoto = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photos to change your profile picture.'
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

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Error', 'Email cannot be empty');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (user) {
      try {
        setUploading(true);

        // Upload profile image if changed
        let imageUrl = user?.profileImage;
        if (profileImage && profileImage !== user?.profileImage) {
          try {
            const result = await ApiService.uploadUserProfileImage(profileImage);
            imageUrl = result.imageUrl;
          } catch (imageError: any) {
            console.error('Image upload failed:', imageError);
            Alert.alert(
              'Image Upload Failed',
              'Failed to upload profile image. Continue without image?',
              [
                { text: 'Cancel', style: 'cancel', onPress: () => setUploading(false) },
                {
                  text: 'Continue',
                  onPress: () => {
                    // Continue with text-only update
                    imageUrl = user?.profileImage;
                  }
                }
              ]
            );
            return;
          }
        }

        // Update profile on backend
        const profileData = {
          name: name.trim(),
          fullName: name.trim(),
          preferredName: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          profileImage: imageUrl,
        };

        const updatedProfile = await ApiService.updateProfile(profileData);

        const updatedUser = {
          ...user,
          ...updatedProfile,
        };

        dispatch(setUser(updatedUser));

        // Sync local state with updated values to prevent hasChanges false positive
        setName(updatedUser.preferredName || updatedUser.name || '');
        setEmail(updatedUser.email || '');
        setPhone(updatedUser.phone || '');
        setProfileImage(updatedUser.profileImage || null);

        Alert.alert(
          'Success',
          'Profile updated successfully!',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } catch (error: any) {
        console.error('Save profile failed:', error);
        Alert.alert('Error', error.message || 'Failed to update profile');
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      
      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border, paddingTop: insets.top }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
          >
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Profile</Text>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={!hasChanges}
          >
            <Text style={[
              styles.saveButtonText,
              { color: hasChanges ? '#C9A96E' : theme.textSecondary }
            ]}>
              Save
            </Text>
          </TouchableOpacity>
        </View>

        {/* Profile Avatar */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: '#C9A96E' }]}>
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={styles.avatarImage}
              />
            ) : (
              <Ionicons name="person" size={40} color="white" />
            )}
          </View>
          <TouchableOpacity
            style={styles.changePhotoButton}
            onPress={handleChangePhoto}
            disabled={uploading}
          >
            <Text style={[styles.changePhotoText, { color: uploading ? '#999' : '#C9A96E' }]}>
              {uploading ? 'Uploading...' : 'Change Photo'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Profile Form */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>PERSONAL INFORMATION</Text>

          {/* Name Field */}
          <View style={[styles.inputContainer, { borderBottomColor: theme.border }]}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Name</Text>
            <TextInput
              style={[styles.textInput, { color: theme.text }]}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="words"
            />
          </View>

          {/* Email Field */}
          <View style={[styles.inputContainer, { borderBottomColor: theme.border }]}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Email</Text>
            <TextInput
              style={[styles.textInput, { color: theme.text }]}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor={theme.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Phone Field */}
          <View style={[styles.inputContainer, styles.lastInputContainer]}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Phone</Text>
            <TextInput
              style={[styles.textInput, { color: theme.text }]}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter your phone number"
              placeholderTextColor={theme.textSecondary}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Account Settings */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>ACCOUNT SETTINGS</Text>

          <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: theme.border }]}
            onPress={() => navigation.navigate('ChangePasscode' as any)}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(201, 169, 110, 0.1)' }]}>
                <Ionicons name="key-outline" size={20} color="#C9A96E" />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  Change Password
                </Text>
                <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                  Update your account password
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, styles.lastItem]}
            onPress={() => navigation.navigate('TwoFactorAuth' as any)}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(201, 169, 110, 0.1)' }]}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#C9A96E" />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  Two-Factor Authentication
                </Text>
                <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                  Add extra security to your account
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Account Info */}
        <View style={styles.accountInfo}>
          <Text style={[styles.accountInfoLabel, { color: theme.textSecondary }]}>
            Account created
          </Text>
          <Text style={[styles.accountInfoValue, { color: theme.text }]}>
            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
          </Text>
          <Text style={[styles.accountInfoLabel, { color: theme.textSecondary, marginTop: 8 }]}>
            Last updated
          </Text>
          <Text style={[styles.accountInfoValue, { color: theme.text }]}>
            {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'Unknown'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 0.5,
    zIndex: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  changePhotoButton: {
    paddingVertical: 4,
  },
  changePhotoText: {
    fontSize: 16,
    fontWeight: '500',
  },
  section: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  inputContainer: {
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  lastInputContainer: {
    borderBottomWidth: 0,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    fontSize: 16,
    paddingVertical: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  accountInfo: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  accountInfoLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
  },
  accountInfoValue: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default EditProfileScreen;