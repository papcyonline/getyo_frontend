import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootState } from '../store';
import { LinearGradient } from 'expo-linear-gradient';

interface PaywallProps {
  visible: boolean;
  onClose: () => void;
  feature: string;
  title: string;
  description: string;
  benefits?: string[];
}

const Paywall: React.FC<PaywallProps> = ({
  visible,
  onClose,
  feature,
  title,
  description,
  benefits = []
}) => {
  const navigation = useNavigation();
  const theme = useSelector((state: RootState) => state.theme.theme);

  const defaultBenefits = [
    'Unlimited AI conversations',
    'Advanced email management',
    'Meeting preparation & briefs',
    'Document intelligence',
    'Financial dashboard',
    'Team management tools',
    'Priority customer support'
  ];

  const displayBenefits = benefits.length > 0 ? benefits : defaultBenefits;

  const handleUpgrade = () => {
    onClose();
    navigation.navigate('Subscription');
  };

  const featureInfo = {
    email_management: {
      icon: 'mail',
      color: '#10B981',
      headline: 'Smart Email Management'
    },
    meeting_prep: {
      icon: 'people',
      color: '#8B5CF6',
      headline: 'AI Meeting Preparation'
    },
    document_intelligence: {
      icon: 'document-text',
      color: '#F59E0B',
      headline: 'Document Intelligence'
    },
    financial_dashboard: {
      icon: 'stats-chart',
      color: '#EF4444',
      headline: 'Financial Dashboard'
    },
    team_management: {
      icon: 'people-circle',
      color: '#C9A96E',
      headline: 'Team Management'
    },
    advanced_analytics: {
      icon: 'analytics',
      color: '#8B5CF6',
      headline: 'Advanced Analytics'
    },
    unlimited_chat: {
      icon: 'chatbubble-ellipses',
      color: '#C9A96E',
      headline: 'Unlimited AI Chat'
    }
  };

  const info = featureInfo[feature as keyof typeof featureInfo] || {
    icon: 'star',
    color: '#C9A96E',
    headline: 'Premium Feature'
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Hero Section */}
            <LinearGradient
              colors={[info.color, `${info.color}99`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroSection}
            >
              <View style={styles.featureIcon}>
                <Ionicons name={info.icon as any} size={48} color="white" />
              </View>
              <Text style={styles.heroTitle}>{info.headline}</Text>
              <Text style={styles.heroSubtitle}>Unlock the full potential of your AI assistant</Text>
            </LinearGradient>

            {/* Content */}
            <View style={styles.content}>
              <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
              <Text style={[styles.description, { color: theme.textSecondary }]}>
                {description}
              </Text>

              {/* Benefits */}
              <View style={styles.benefitsSection}>
                <Text style={[styles.benefitsTitle, { color: theme.text }]}>
                  What you'll get with Yo! Executive:
                </Text>
                {displayBenefits.map((benefit, index) => (
                  <View key={index} style={styles.benefitItem}>
                    <View style={[styles.checkIcon, { backgroundColor: info.color }]}>
                      <Ionicons name="checkmark" size={14} color="white" />
                    </View>
                    <Text style={[styles.benefitText, { color: theme.text }]}>
                      {benefit}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Pricing Preview */}
              <View style={[styles.pricingPreview, { backgroundColor: theme.surface }]}>
                <View style={styles.pricingHeader}>
                  <Text style={[styles.pricingTitle, { color: theme.text }]}>
                    Yo! Executive
                  </Text>
                  <View style={styles.pricingBadge}>
                    <Text style={styles.pricingBadgeText}>MOST POPULAR</Text>
                  </View>
                </View>

                <View style={styles.priceRow}>
                  <Text style={[styles.price, { color: info.color }]}>$99</Text>
                  <Text style={[styles.priceUnit, { color: theme.textSecondary }]}>/month</Text>
                </View>

                <Text style={[styles.annualSavings, { color: '#10B981' }]}>
                  Save $198 with annual billing
                </Text>

                <Text style={[styles.trialText, { color: theme.textSecondary }]}>
                  Start with 14-day free trial • Cancel anytime
                </Text>
              </View>

              {/* Social Proof */}
              <View style={styles.socialProof}>
                <View style={styles.ratingRow}>
                  <View style={styles.stars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons key={star} name="star" size={16} color="#F59E0B" />
                    ))}
                  </View>
                  <Text style={[styles.ratingText, { color: theme.text }]}>
                    4.9/5 from 1,000+ executives
                  </Text>
                </View>

                <Text style={[styles.testimonial, { color: theme.textSecondary }]}>
                  "This AI assistant has transformed how I manage my executive responsibilities.
                  The ROI is incredible." - Sarah K., CEO
                </Text>
              </View>

              {/* Trust Indicators */}
              <View style={styles.trustIndicators}>
                <View style={styles.trustItem}>
                  <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                  <Text style={[styles.trustText, { color: theme.textSecondary }]}>
                    Enterprise security
                  </Text>
                </View>
                <View style={styles.trustItem}>
                  <Ionicons name="refresh" size={20} color="#C9A96E" />
                  <Text style={[styles.trustText, { color: theme.textSecondary }]}>
                    Cancel anytime
                  </Text>
                </View>
                <View style={styles.trustItem}>
                  <Ionicons name="headset" size={20} color="#8B5CF6" />
                  <Text style={[styles.trustText, { color: theme.textSecondary }]}>
                    Priority support
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.upgradeButton, { backgroundColor: info.color }]}
              onPress={handleUpgrade}
            >
              <Text style={styles.upgradeButtonText}>Start Free Trial</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.laterButton} onPress={onClose}>
              <Text style={[styles.laterButtonText, { color: theme.textSecondary }]}>
                Maybe later
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    marginHorizontal: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  featureIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 24,
  },
  benefitsSection: {
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  benefitText: {
    fontSize: 15,
    flex: 1,
  },
  pricingPreview: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  pricingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pricingTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  pricingBadge: {
    backgroundColor: '#C9A96E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pricingBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  priceUnit: {
    fontSize: 16,
    marginLeft: 4,
  },
  annualSavings: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  trialText: {
    fontSize: 13,
  },
  socialProof: {
    marginBottom: 24,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  testimonial: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  trustIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  trustItem: {
    alignItems: 'center',
    flex: 1,
  },
  trustText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  actionButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  upgradeButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  laterButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  laterButtonText: {
    fontSize: 14,
  },
});

export default Paywall;