import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootState } from '../store';

const SubscriptionScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const theme = useSelector((state: RootState) => state.theme.theme);
  const user = useSelector((state: RootState) => state.user.user);

  const [selectedPlan, setSelectedPlan] = useState('executive');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  const handleBackPress = () => {
    navigation.goBack();
  };

  const subscriptionPlans = [
    {
      id: 'starter',
      name: 'Yo! Starter',
      tagline: 'For professionals getting started',
      price: { monthly: 29, annual: 290 },
      features: [
        'Basic AI conversations',
        'Simple task management',
        'Email summaries (10/month)',
        'Calendar integration',
        'Standard support',
        '5 voice messages/day'
      ],
      limitations: [
        'Limited AI responses',
        'Basic analytics only',
        'No team features'
      ],
      color: '#10B981',
      popular: false,
    },
    {
      id: 'executive',
      name: 'Yo! Executive',
      tagline: 'For senior leaders and executives',
      price: { monthly: 99, annual: 990 },
      features: [
        'Unlimited AI conversations',
        'Advanced task & project management',
        'Unlimited email management',
        'Meeting preparation & briefs',
        'Document intelligence',
        'Financial dashboard',
        'Team management tools',
        'Priority support',
        'Custom AI training',
        'Advanced analytics',
        'Unlimited voice messages',
        'Integration with 50+ tools'
      ],
      limitations: [],
      color: '#000000',
      popular: true,
    },
    {
      id: 'enterprise',
      name: 'Yo! Enterprise',
      tagline: 'For organizations and teams',
      price: { monthly: 299, annual: 2990 },
      features: [
        'Everything in Executive',
        'Multi-user team management',
        'Advanced security & compliance',
        'Custom integrations',
        'Dedicated success manager',
        'White-label options',
        'SSO & LDAP integration',
        'Advanced reporting',
        'API access',
        '24/7 premium support',
        'Custom AI model training',
        'Unlimited team members'
      ],
      limitations: [],
      color: '#8B5CF6',
      popular: false,
    },
  ];

  const calculateSavings = (plan: any) => {
    const monthlyCost = plan.price.monthly * 12;
    const annualCost = plan.price.annual;
    const savings = monthlyCost - annualCost;
    const percentage = Math.round((savings / monthlyCost) * 100);
    return { amount: savings, percentage };
  };

  const handlePurchase = async (planId: string) => {
    const plan = subscriptionPlans.find(p => p.id === planId);
    const price = billingCycle === 'monthly' ? plan?.price.monthly : plan?.price.annual;

    Alert.alert(
      'Confirm Subscription',
      `Subscribe to ${plan?.name} for $${price}/${billingCycle === 'monthly' ? 'month' : 'year'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Subscribe',
          onPress: () => {
            // Here you would integrate with RevenueCat or similar
            Alert.alert('Success!', 'Welcome to your premium AI assistant!');
          }
        }
      ]
    );
  };

  const featureComparison = [
    { feature: 'AI Conversations', starter: '100/month', executive: 'Unlimited', enterprise: 'Unlimited' },
    { feature: 'Email Management', starter: '10/month', executive: 'Unlimited', enterprise: 'Unlimited' },
    { feature: 'Meeting Prep', starter: '❌', executive: '✅', enterprise: '✅' },
    { feature: 'Document Intelligence', starter: '❌', executive: '✅', enterprise: '✅' },
    { feature: 'Financial Dashboard', starter: '❌', executive: '✅', enterprise: '✅' },
    { feature: 'Team Management', starter: '❌', executive: 'Up to 10', enterprise: 'Unlimited' },
    { feature: 'Custom Integrations', starter: '❌', executive: 'Basic', enterprise: 'Advanced' },
    { feature: 'Priority Support', starter: '❌', executive: '✅', enterprise: '24/7 Premium' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Choose Your Plan</Text>
        </View>
        <TouchableOpacity style={styles.helpButton}>
          <Ionicons name="help-circle-outline" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {/* Hero Section */}
        <Text style={styles.heroTitle}>Unlock Your Executive Potential</Text>
          <Text style={styles.heroSubtitle}>
            Join 10,000+ executives using AI to maximize productivity and drive results
          </Text>

          {/* Billing Toggle */}
          <View style={styles.billingToggle}>
            <TouchableOpacity
              style={[
                styles.billingOption,
                billingCycle === 'monthly' && styles.billingOptionActive
              ]}
              onPress={() => setBillingCycle('monthly')}
            >
              <Text style={[
                styles.billingText,
                { color: billingCycle === 'monthly' ? '#FFF7F5' : 'rgba(255, 247, 245,0.8)' }
              ]}>
                Monthly
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.billingOption,
                billingCycle === 'annual' && styles.billingOptionActive
              ]}
              onPress={() => setBillingCycle('annual')}
            >
              <Text style={[
                styles.billingText,
                { color: billingCycle === 'annual' ? '#FFF7F5' : 'rgba(255, 247, 245,0.8)' }
              ]}>
                Annual
              </Text>
              <View style={styles.savingsBadge}>
                <Text style={styles.savingsText}>Save 20%</Text>
              </View>
            </TouchableOpacity>
          </View>

        {/* Subscription Plans */}
        <View style={styles.plansContainer}>
          {subscriptionPlans.map((plan) => {
            const savings = calculateSavings(plan);
            const currentPrice = billingCycle === 'monthly' ? plan.price.monthly : plan.price.annual;

            return (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planCard,
                  { backgroundColor: theme.surface },
                  selectedPlan === plan.id && { borderColor: plan.color, borderWidth: 2 },
                  plan.popular && styles.popularPlan
                ]}
                onPress={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <View style={[styles.popularBadge, { backgroundColor: plan.color }]}>
                    <Text style={styles.popularText}>MOST POPULAR</Text>
                  </View>
                )}

                <View style={styles.planHeader}>
                  <Text style={[styles.planName, { color: theme.text }]}>{plan.name}</Text>
                  <Text style={[styles.planTagline, { color: theme.textSecondary }]}>
                    {plan.tagline}
                  </Text>
                </View>

                <View style={styles.planPricing}>
                  <View style={styles.priceRow}>
                    <Text style={[styles.planPrice, { color: plan.color }]}>
                      ${currentPrice}
                    </Text>
                    <Text style={[styles.planCycle, { color: theme.textSecondary }]}>
                      /{billingCycle === 'monthly' ? 'month' : 'year'}
                    </Text>
                  </View>
                  {billingCycle === 'annual' && (
                    <Text style={[styles.savingsText, { color: '#10B981' }]}>
                      Save ${savings.amount} ({savings.percentage}%) annually
                    </Text>
                  )}
                </View>

                <View style={styles.planFeatures}>
                  {plan.features.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={16} color={plan.color} />
                      <Text style={[styles.featureText, { color: theme.text }]}>
                        {feature}
                      </Text>
                    </View>
                  ))}

                  {plan.limitations.map((limitation, index) => (
                    <View key={index} style={styles.featureItem}>
                      <Ionicons name="close-circle" size={16} color="#EF4444" />
                      <Text style={[styles.featureText, { color: theme.textSecondary }]}>
                        {limitation}
                      </Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[
                    styles.selectPlanButton,
                    { backgroundColor: selectedPlan === plan.id ? plan.color : theme.border }
                  ]}
                  onPress={() => handlePurchase(plan.id)}
                >
                  <Text style={[
                    styles.selectPlanText,
                    { color: selectedPlan === plan.id ? 'white' : theme.text }
                  ]}>
                    {selectedPlan === plan.id ? 'Subscribe Now' : 'Select Plan'}
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Feature Comparison Table */}
        <View style={[styles.comparisonSection, { backgroundColor: theme.surface }]}>
          <Text style={[styles.comparisonTitle, { color: theme.text }]}>
            Feature Comparison
          </Text>

          <View style={styles.comparisonTable}>
            <View style={styles.comparisonHeader}>
              <Text style={[styles.comparisonHeaderText, { color: theme.text }]}>Feature</Text>
              <Text style={[styles.comparisonHeaderText, { color: theme.text }]}>Starter</Text>
              <Text style={[styles.comparisonHeaderText, { color: theme.text }]}>Executive</Text>
              <Text style={[styles.comparisonHeaderText, { color: theme.text }]}>Enterprise</Text>
            </View>

            {featureComparison.map((item, index) => (
              <View key={index} style={[styles.comparisonRow, { borderBottomColor: theme.border }]}>
                <Text style={[styles.comparisonFeature, { color: theme.text }]}>
                  {item.feature}
                </Text>
                <Text style={[styles.comparisonValue, { color: theme.textSecondary }]}>
                  {item.starter}
                </Text>
                <Text style={[styles.comparisonValue, { color: '#FFF7F5' }]}>
                  {item.executive}
                </Text>
                <Text style={[styles.comparisonValue, { color: '#8B5CF6' }]}>
                  {item.enterprise}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Trust Indicators */}
        <View style={styles.trustSection}>
          <View style={styles.trustItem}>
            <Ionicons name="shield-checkmark" size={24} color="#10B981" />
            <Text style={[styles.trustText, { color: theme.text }]}>
              Enterprise-grade security
            </Text>
          </View>
          <View style={styles.trustItem}>
            <Ionicons name="refresh" size={24} color="#FFF7F5" />
            <Text style={[styles.trustText, { color: theme.text }]}>
              Cancel anytime, no questions asked
            </Text>
          </View>
          <View style={styles.trustItem}>
            <Ionicons name="star" size={24} color="#F59E0B" />
            <Text style={[styles.trustText, { color: theme.text }]}>
              4.9/5 rating from 1,000+ executives
            </Text>
          </View>
        </View>

        {/* FAQ */}
        <View style={[styles.faqSection, { backgroundColor: theme.surface }]}>
          <Text style={[styles.faqTitle, { color: theme.text }]}>
            Frequently Asked Questions
          </Text>

          <View style={styles.faqItem}>
            <Text style={[styles.faqQuestion, { color: theme.text }]}>
              Can I switch plans anytime?
            </Text>
            <Text style={[styles.faqAnswer, { color: theme.textSecondary }]}>
              Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={[styles.faqQuestion, { color: theme.text }]}>
              Is there a free trial?
            </Text>
            <Text style={[styles.faqAnswer, { color: theme.textSecondary }]}>
              Yes, all plans include a 14-day free trial. No credit card required to start.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={[styles.faqQuestion, { color: theme.text }]}>
              What about data security?
            </Text>
            <Text style={[styles.faqAnswer, { color: theme.textSecondary }]}>
              We use enterprise-grade encryption and never share your data. SOC 2 Type II compliant.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 0.5,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  helpButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSection: {
    padding: 24,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 247, 245, 0.9)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  billingToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 247, 245, 0.2)',
    borderRadius: 12,
    padding: 4,
  },
  billingOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    position: 'relative',
  },
  billingOptionActive: {
    backgroundColor: 'white',
  },
  billingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  savingsBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  savingsText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '700',
  },
  plansContainer: {
    padding: 16,
    gap: 16,
  },
  planCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    position: 'relative',
  },
  popularPlan: {
    transform: [{ scale: 1.02 }],
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    left: '50%',
    marginLeft: -60,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  popularText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  planHeader: {
    marginBottom: 16,
    marginTop: 8,
  },
  planName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  planTagline: {
    fontSize: 14,
  },
  planPricing: {
    marginBottom: 20,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  planCycle: {
    fontSize: 16,
    marginLeft: 4,
  },
  planFeatures: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  selectPlanButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  selectPlanText: {
    fontSize: 16,
    fontWeight: '600',
  },
  comparisonSection: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
  },
  comparisonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  comparisonTable: {},
  comparisonHeader: {
    flexDirection: 'row',
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#FFF7F5',
    marginBottom: 8,
  },
  comparisonHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  comparisonRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  comparisonFeature: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  comparisonValue: {
    flex: 1,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  trustSection: {
    padding: 20,
    gap: 16,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trustText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  faqSection: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
  },
  faqTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  faqItem: {
    marginBottom: 16,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default SubscriptionScreen;