import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface TermsPrivacyModalProps {
  visible: boolean;
  onClose: () => void;
  onAccept?: () => void;
  showAcceptButton?: boolean;
  acceptButtonText?: string;
  title?: string;
}

const TermsPrivacyModal: React.FC<TermsPrivacyModalProps> = ({
  visible,
  onClose,
  onAccept,
  showAcceptButton = false,
  acceptButtonText = 'Accept',
  title = 'Terms of Service & Privacy Policy',
}) => {
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    if (onAccept) {
      setLoading(true);
      try {
        await onAccept();
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={['#3396D3', '#2578B5']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{title}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Content */}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Terms of Service Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Terms of Service</Text>
            <Text style={styles.sectionSubtitle}>Last Updated: January 15, 2025</Text>

            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>1. Service Agreement</Text>
              <Text style={styles.paragraph}>
                Yo! Personal Assistant provides AI-powered personal assistance services to help you manage your daily tasks, schedule, and communications. By using our service, you acknowledge that you understand and agree to be bound by these terms.
              </Text>
            </View>

            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>2. User Responsibilities</Text>
              <Text style={styles.paragraph}>
                You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account. You agree to use the service only for lawful purposes and in accordance with these terms.
              </Text>
            </View>

            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>3. AI Technology</Text>
              <Text style={styles.paragraph}>
                Our service uses artificial intelligence to provide personalized assistance. While we strive for accuracy, AI responses may not always be perfect. You should verify important information and decisions.
              </Text>
            </View>

            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>4. Service Availability</Text>
              <Text style={styles.paragraph}>
                We aim to provide continuous service availability, but we do not guarantee uninterrupted access. We may temporarily suspend the service for maintenance or updates.
              </Text>
            </View>

            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>5. Limitations</Text>
              <Text style={styles.paragraph}>
                Our service is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the service.
              </Text>
            </View>
          </View>

          {/* Privacy Policy Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Privacy Policy</Text>
            <Text style={styles.sectionSubtitle}>Last Updated: January 15, 2025</Text>

            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>1. Data We Collect</Text>
              <Text style={styles.paragraph}>
                We collect information you provide directly, such as account details, preferences, and communications with our AI assistant. We also collect usage data to improve our services.
              </Text>
            </View>

            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>2. How We Use Your Data</Text>
              <Text style={styles.paragraph}>
                We use your data to provide personalized assistance, improve our AI models, ensure service security, and communicate with you about updates and features.
              </Text>
            </View>

            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>3. Data Protection</Text>
              <Text style={styles.paragraph}>
                We implement industry-standard security measures to protect your data. Your information is encrypted in transit and at rest, and access is restricted to authorized personnel only.
              </Text>
            </View>

            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>4. Your Privacy Rights</Text>
              <Text style={styles.paragraph}>
                You have the right to access, update, or delete your personal information. You can also opt out of certain data processing activities through your account settings.
              </Text>
            </View>

            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>5. Third-Party Services</Text>
              <Text style={styles.paragraph}>
                We may integrate with third-party services to enhance functionality. These integrations are governed by their respective privacy policies in addition to ours.
              </Text>
            </View>

            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>6. Data Retention</Text>
              <Text style={styles.paragraph}>
                We retain your data only as long as necessary to provide our services or as required by law. You can request data deletion through your account settings.
              </Text>
            </View>

            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>7. Contact & Support</Text>
              <Text style={styles.paragraph}>
                If you have questions about privacy or these terms, please contact our support team through the app or email us at privacy@yoassistant.com.
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Version 1.0 • Effective January 15, 2025
            </Text>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        {showAcceptButton && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={handleAccept}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <MaterialCommunityIcons name="check-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.acceptButtonText}>{acceptButtonText}</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.declineButton}
              onPress={onClose}
              disabled={loading}
              activeOpacity={0.9}
            >
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  subsection: {
    marginBottom: 20,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3396D3',
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 22,
    fontWeight: '400',
  },
  footer: {
    marginTop: 32,
    marginBottom: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  acceptButton: {
    height: 56,
    backgroundColor: '#3396D3',
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    shadowColor: '#3396D3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  acceptButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  declineButton: {
    height: 56,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.3,
  },
});

export default TermsPrivacyModal;
