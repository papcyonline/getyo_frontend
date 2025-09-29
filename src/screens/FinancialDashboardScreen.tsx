import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootState } from '../store';
import { LinearGradient } from 'expo-linear-gradient';
import { useSubscription } from '../contexts/SubscriptionContext';
import Paywall from '../components/Paywall';

const FinancialDashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const theme = useSelector((state: RootState) => state.theme.theme);
  const { hasFeature } = useSubscription();

  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    if (!hasFeature('financial_dashboard')) {
      setShowPaywall(true);
    }
  }, [hasFeature]);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const periods = [
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'quarter', label: 'Quarter' },
    { key: 'year', label: 'Year' },
  ];

  const financialMetrics = {
    revenue: { value: '$2.4M', change: 23.5, period: 'vs last month' },
    profit: { value: '$680K', change: 18.2, period: 'vs last month' },
    expenses: { value: '$1.72M', change: -5.1, period: 'vs last month' },
    cashFlow: { value: '$1.1M', change: 34.2, period: 'vs last month' },
  };

  const portfolioData = [
    { name: 'Stock Portfolio', value: '$8.2M', allocation: 45, change: 12.3, color: '#10B981' },
    { name: 'Real Estate', value: '$5.8M', allocation: 32, change: 8.7, color: '#F59E0B' },
    { name: 'Bonds', value: '$2.4M', allocation: 13, change: 3.2, color: '#8B5CF6' },
    { name: 'Crypto', value: '$1.2M', allocation: 7, change: -15.4, color: '#EF4444' },
    { name: 'Cash', value: '$600K', allocation: 3, change: 0.1, color: '#6B7280' },
  ];

  const recentTransactions = [
    {
      id: '1',
      type: 'income',
      description: 'Q3 Revenue - Client Services',
      amount: '$125,000',
      date: 'Today',
      category: 'revenue'
    },
    {
      id: '2',
      type: 'expense',
      description: 'Office Lease - Q4 Payment',
      amount: '$28,500',
      date: 'Yesterday',
      category: 'operations'
    },
    {
      id: '3',
      type: 'investment',
      description: 'Tech Stock Purchase - AAPL',
      amount: '$50,000',
      date: '2 days ago',
      category: 'investments'
    },
    {
      id: '4',
      type: 'income',
      description: 'Consulting Fees - TechCorp',
      amount: '$75,000',
      date: '3 days ago',
      category: 'revenue'
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Dotted Background Pattern */}
      <View style={styles.dottedBackground}>
        <View style={styles.dotRow}>
          {Array.from({ length: 8 }).map((_, i) => (
            <View key={`row1-${i}`} style={[styles.dot, { opacity: 0.1 }]} />
          ))}
        </View>
        <View style={styles.dotRow}>
          {Array.from({ length: 7 }).map((_, i) => (
            <View key={`row2-${i}`} style={[styles.dot, { opacity: 0.08 }]} />
          ))}
        </View>
        <View style={styles.dotRow}>
          {Array.from({ length: 8 }).map((_, i) => (
            <View key={`row3-${i}`} style={[styles.dot, { opacity: 0.12 }]} />
          ))}
        </View>
        <View style={styles.dotRow}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={`row4-${i}`} style={[styles.dot, { opacity: 0.09 }]} />
          ))}
        </View>
        <View style={styles.dotRow}>
          {Array.from({ length: 9 }).map((_, i) => (
            <View key={`row5-${i}`} style={[styles.dot, { opacity: 0.11 }]} />
          ))}
        </View>
      </View>

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Financial Dashboard</Text>
        </View>
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Period Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodContainer}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {periods.map(period => (
          <TouchableOpacity
            key={period.key}
            style={[
              styles.periodButton,
              { backgroundColor: theme.surface },
              selectedPeriod === period.key && { backgroundColor: '#FFFFFF' }
            ]}
            onPress={() => setSelectedPeriod(period.key)}
          >
            <Text style={[
              styles.periodText,
              { color: selectedPeriod === period.key ? 'white' : theme.text }
            ]}>
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {/* Key Metrics */}
        <View style={styles.metricsGrid}>
          {Object.entries(financialMetrics).map(([key, metric]) => (
            <View key={key} style={[styles.metricCard, { backgroundColor: theme.surface }]}>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </Text>
              <Text style={[styles.metricValue, { color: theme.text }]}>
                {metric.value}
              </Text>
              <View style={styles.metricChange}>
                <Ionicons
                  name={metric.change > 0 ? 'trending-up' : 'trending-down'}
                  size={14}
                  color={metric.change > 0 ? '#10B981' : '#EF4444'}
                />
                <Text style={[
                  styles.metricChangeText,
                  { color: metric.change > 0 ? '#10B981' : '#EF4444' }
                ]}>
                  {Math.abs(metric.change)}%
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Portfolio Overview */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Investment Portfolio
          </Text>
          <Text style={[styles.portfolioTotal, { color: theme.text }]}>
            Total Value: $18.2M
          </Text>

          {portfolioData.map((asset, index) => (
            <View key={index} style={styles.portfolioItem}>
              <View style={styles.portfolioItemHeader}>
                <View style={styles.portfolioItemLeft}>
                  <View style={[styles.portfolioIndicator, { backgroundColor: asset.color }]} />
                  <View>
                    <Text style={[styles.portfolioName, { color: theme.text }]}>
                      {asset.name}
                    </Text>
                    <Text style={[styles.portfolioAllocation, { color: theme.textSecondary }]}>
                      {asset.allocation}% allocation
                    </Text>
                  </View>
                </View>
                <View style={styles.portfolioItemRight}>
                  <Text style={[styles.portfolioValue, { color: theme.text }]}>
                    {asset.value}
                  </Text>
                  <View style={styles.portfolioChange}>
                    <Ionicons
                      name={asset.change > 0 ? 'caret-up' : 'caret-down'}
                      size={12}
                      color={asset.change > 0 ? '#10B981' : '#EF4444'}
                    />
                    <Text style={[
                      styles.portfolioChangeText,
                      { color: asset.change > 0 ? '#10B981' : '#EF4444' }
                    ]}>
                      {Math.abs(asset.change)}%
                    </Text>
                  </View>
                </View>
              </View>

              <View style={[styles.allocationBar, { backgroundColor: theme.border }]}>
                <View
                  style={[
                    styles.allocationFill,
                    {
                      width: `${asset.allocation}%`,
                      backgroundColor: asset.color
                    }
                  ]}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Recent Transactions */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Recent Transactions
            </Text>
            <TouchableOpacity>
              <Text style={[styles.seeAllText, { color: '#FFFFFF' }]}>
                See All
              </Text>
            </TouchableOpacity>
          </View>

          {recentTransactions.map((transaction, index) => (
            <TouchableOpacity key={transaction.id} style={styles.transactionItem}>
              <View style={[
                styles.transactionIcon,
                {
                  backgroundColor:
                    transaction.type === 'income' ? 'rgba(16, 185, 129, 0.1)' :
                    transaction.type === 'expense' ? 'rgba(239, 68, 68, 0.1)' :
                    'rgba(21, 183, 232, 0.1)'
                }
              ]}>
                <Ionicons
                  name={
                    transaction.type === 'income' ? 'trending-up' :
                    transaction.type === 'expense' ? 'trending-down' :
                    'swap-horizontal'
                  }
                  size={20}
                  color={
                    transaction.type === 'income' ? '#10B981' :
                    transaction.type === 'expense' ? '#EF4444' :
                    '#FFFFFF'
                  }
                />
              </View>
              <View style={styles.transactionContent}>
                <Text style={[styles.transactionDescription, { color: theme.text }]}>
                  {transaction.description}
                </Text>
                <Text style={[styles.transactionDate, { color: theme.textSecondary }]}>
                  {transaction.date} • {transaction.category}
                </Text>
              </View>
              <Text style={[
                styles.transactionAmount,
                {
                  color: transaction.type === 'income' ? '#10B981' :
                         transaction.type === 'expense' ? '#EF4444' :
                         theme.text
                }
              ]}>
                {transaction.type === 'expense' ? '-' : '+'}{transaction.amount}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* AI Insights */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <View style={styles.aiHeader}>
            <Ionicons name="sparkles" size={16} color="#FFFFFF" />
            <Text style={[styles.sectionTitle, { color: theme.text, marginLeft: 8 }]}>
              AI Financial Insights
            </Text>
          </View>

          <View style={styles.insightItem}>
            <Ionicons name="trending-up" size={20} color="#10B981" />
            <Text style={[styles.insightText, { color: theme.text }]}>
              Revenue growth is accelerating. Current trajectory suggests 28% annual growth.
            </Text>
          </View>

          <View style={styles.insightItem}>
            <Ionicons name="warning" size={20} color="#F59E0B" />
            <Text style={[styles.insightText, { color: theme.text }]}>
              Crypto allocation is above recommended 5%. Consider rebalancing portfolio.
            </Text>
          </View>

          <View style={styles.insightItem}>
            <Ionicons name="bulb" size={20} color="#8B5CF6" />
            <Text style={[styles.insightText, { color: theme.text }]}>
              Tax optimization opportunity: Harvest losses in underperforming positions.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Paywall Modal */}
      <Paywall
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        feature="financial_dashboard"
        title="Financial Dashboard"
        description="Get comprehensive financial insights with AI-powered portfolio analysis, expense tracking, and investment recommendations."
        benefits={[
          'Real-time portfolio tracking',
          'AI financial insights and recommendations',
          'Expense categorization and analysis',
          'Investment performance monitoring',
          'Tax optimization suggestions',
          'Financial goal tracking'
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dottedBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
    paddingTop: 120,
    paddingHorizontal: 20,
  },
  dotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 60,
    paddingHorizontal: 30,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
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
  settingsButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  periodButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '500',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: '47%',
    padding: 16,
    borderRadius: 16,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  metricChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricChangeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  portfolioTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  portfolioItem: {
    marginBottom: 20,
  },
  portfolioItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  portfolioItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  portfolioIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  portfolioName: {
    fontSize: 14,
    fontWeight: '600',
  },
  portfolioAllocation: {
    fontSize: 12,
    marginTop: 2,
  },
  portfolioItemRight: {
    alignItems: 'flex-end',
  },
  portfolioValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  portfolioChange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  portfolioChangeText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 2,
  },
  allocationBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  allocationFill: {
    height: '100%',
    borderRadius: 3,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionContent: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
    marginLeft: 12,
  },
});

export default FinancialDashboardScreen;