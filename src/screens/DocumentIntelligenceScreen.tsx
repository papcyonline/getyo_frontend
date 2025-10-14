import React, { useState, useEffect } from 'react';
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
import { useSubscription } from '../contexts/SubscriptionContext';
import Paywall from '../components/Paywall';

const DocumentIntelligenceScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const theme = useSelector((state: RootState) => state.theme.theme);
  const user = useSelector((state: RootState) => state.user.user);
  const { hasFeature } = useSubscription();

  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    if (!hasFeature('document_intelligence')) {
      setShowPaywall(true);
    }
  }, [hasFeature]);

  const [selectedTab, setSelectedTab] = useState('recent');

  const handleBackPress = () => {
    navigation.goBack();
  };

  // Mock document data
  const documents = [
    {
      id: '1',
      name: 'Q3_Financial_Report.pdf',
      type: 'financial',
      size: '2.4 MB',
      uploadedAt: '2 hours ago',
      aiSummary: 'Revenue up 23%, expenses controlled, strong cash flow position. 3 key risks identified.',
      keyPoints: [
        'Revenue increased 23% YoY to $12.5M',
        'EBITDA margin improved to 24%',
        'Cash flow from operations: $3.2M',
        'R&D investment up 15%'
      ],
      status: 'analyzed',
      confidence: 94,
    },
    {
      id: '2',
      name: 'Partnership_Agreement_TechCorp.pdf',
      type: 'legal',
      size: '1.8 MB',
      uploadedAt: '5 hours ago',
      aiSummary: 'Standard partnership terms with 3 clauses requiring attention. Revenue sharing 60/40.',
      keyPoints: [
        'Revenue sharing: 60% us, 40% TechCorp',
        'Exclusivity clause in North America',
        'IP ownership remains separate',
        'Termination clause: 90 days notice'
      ],
      status: 'analyzed',
      confidence: 89,
    },
    {
      id: '3',
      name: 'Market_Research_AI_Trends.docx',
      type: 'research',
      size: '3.2 MB',
      uploadedAt: '1 day ago',
      aiSummary: 'AI market growing 40% annually. Key opportunities in healthcare and finance sectors.',
      keyPoints: [
        'AI market size: $190B by 2025',
        'Healthcare AI: fastest growing segment',
        'Key competitors: 8 major players',
        'Investment opportunities identified'
      ],
      status: 'analyzed',
      confidence: 91,
    },
    {
      id: '4',
      name: 'Employee_Performance_Review.xlsx',
      type: 'hr',
      size: '0.8 MB',
      uploadedAt: '2 days ago',
      aiSummary: 'Overall team performance strong. 3 promotions recommended, 1 improvement plan needed.',
      keyPoints: [
        'Team productivity up 18%',
        'Top performers: Sarah, Michael, Lisa',
        'Skills gap in data analytics',
        'Retention rate: 94%'
      ],
      status: 'analyzed',
      confidence: 96,
    }
  ];

  const templates = [
    {
      id: '1',
      name: 'Contract Analysis',
      description: 'Extract key terms, dates, and obligations',
      icon: 'document-text',
      color: '#10B981'
    },
    {
      id: '2',
      name: 'Financial Summary',
      description: 'Generate executive summary with key metrics',
      icon: 'stats-chart',
      color: '#F59E0B'
    },
    {
      id: '3',
      name: 'Meeting Minutes',
      description: 'Extract action items and decisions',
      icon: 'people',
      color: '#8B5CF6'
    },
    {
      id: '4',
      name: 'Research Brief',
      description: 'Summarize findings and recommendations',
      icon: 'search',
      color: '#FFF7F5'
    }
  ];

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'financial': return 'stats-chart';
      case 'legal': return 'shield-checkmark';
      case 'research': return 'search';
      case 'hr': return 'people';
      default: return 'document-text';
    }
  };

  const getDocumentColor = (type: string) => {
    switch (type) {
      case 'financial': return '#10B981';
      case 'legal': return '#EF4444';
      case 'research': return '#FFF7F5';
      case 'hr': return '#8B5CF6';
      default: return theme.textSecondary;
    }
  };

  const handleUploadDocument = () => {
    Alert.alert('Upload Document', 'Choose upload method', [
      { text: 'Camera', onPress: () => Alert.alert('Camera', 'Opening camera...') },
      { text: 'Files', onPress: () => Alert.alert('Files', 'Opening file picker...') },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Document Intelligence</Text>
        </View>
        <TouchableOpacity style={styles.uploadButton} onPress={handleUploadDocument}>
          <Ionicons name="add" size={24} color="#FFF7F5" />
        </TouchableOpacity>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'recent' && { borderBottomColor: '#FFF7F5', borderBottomWidth: 2 }
          ]}
          onPress={() => setSelectedTab('recent')}
        >
          <Text style={[
            styles.tabText,
            { color: selectedTab === 'recent' ? '#FFF7F5' : theme.textSecondary }
          ]}>
            Recent Documents
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'templates' && { borderBottomColor: '#FFF7F5', borderBottomWidth: 2 }
          ]}
          onPress={() => setSelectedTab('templates')}
        >
          <Text style={[
            styles.tabText,
            { color: selectedTab === 'templates' ? '#FFF7F5' : theme.textSecondary }
          ]}>
            Analysis Templates
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {selectedTab === 'recent' ? (
          <View style={styles.documentsContainer}>
            {documents.map((doc, index) => (
              <TouchableOpacity
                key={doc.id}
                style={[styles.documentCard, { backgroundColor: theme.surface }]}
              >
                <View style={styles.documentHeader}>
                  <View style={[
                    styles.documentIcon,
                    { backgroundColor: `${getDocumentColor(doc.type)}20` }
                  ]}>
                    <Ionicons
                      name={getDocumentIcon(doc.type) as any}
                      size={24}
                      color={getDocumentColor(doc.type)}
                    />
                  </View>
                  <View style={styles.documentInfo}>
                    <Text style={[styles.documentName, { color: theme.text }]} numberOfLines={1}>
                      {doc.name}
                    </Text>
                    <View style={styles.documentMeta}>
                      <Text style={[styles.documentSize, { color: theme.textSecondary }]}>
                        {doc.size}
                      </Text>
                      <Text style={[styles.documentDate, { color: theme.textSecondary }]}>
                        • {doc.uploadedAt}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.confidenceScore}>
                    <Text style={[styles.confidenceText, { color: '#FFF7F5' }]}>
                      {doc.confidence}%
                    </Text>
                  </View>
                </View>

                <View style={styles.aiSummaryContainer}>
                  <View style={styles.aiSummaryHeader}>
                    <Ionicons name="sparkles" size={14} color="#FFF7F5" />
                    <Text style={[styles.aiSummaryLabel, { color: '#FFF7F5' }]}>
                      AI Summary
                    </Text>
                  </View>
                  <Text style={[styles.aiSummaryText, { color: theme.text }]}>
                    {doc.aiSummary}
                  </Text>
                </View>

                <View style={styles.keyPointsContainer}>
                  <Text style={[styles.keyPointsLabel, { color: theme.text }]}>
                    Key Points
                  </Text>
                  {doc.keyPoints.map((point, pointIndex) => (
                    <View key={pointIndex} style={styles.keyPointItem}>
                      <View style={[styles.keyPointBullet, { backgroundColor: getDocumentColor(doc.type) }]} />
                      <Text style={[styles.keyPointText, { color: theme.textSecondary }]}>
                        {point}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.documentActions}>
                  <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#FFF7F5' }]}>
                    <Ionicons name="eye" size={16} color="white" />
                    <Text style={styles.actionButtonText}>View Full Analysis</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}>
                    <Ionicons name="download" size={16} color={theme.text} />
                    <Text style={[styles.actionButtonText, { color: theme.text }]}>Export</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.templatesContainer}>
            {templates.map(template => (
              <TouchableOpacity
                key={template.id}
                style={[styles.templateCard, { backgroundColor: theme.surface }]}
              >
                <View style={[styles.templateIcon, { backgroundColor: `${template.color}20` }]}>
                  <Ionicons name={template.icon as any} size={24} color={template.color} />
                </View>
                <View style={styles.templateContent}>
                  <Text style={[styles.templateName, { color: theme.text }]}>
                    {template.name}
                  </Text>
                  <Text style={[styles.templateDescription, { color: theme.textSecondary }]}>
                    {template.description}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            ))}

            {/* AI Assistant Card */}
            <View style={[styles.aiAssistantCard, { backgroundColor: theme.surface }]}>
              <View style={styles.aiAssistantHeader}>
                <Ionicons name="sparkles" size={20} color="#FFF7F5" />
                <Text style={[styles.aiAssistantTitle, { color: theme.text }]}>
                  {user?.assistantName || 'Yo!'} Document Assistant
                </Text>
              </View>
              <Text style={[styles.aiAssistantText, { color: theme.textSecondary }]}>
                Upload any document and I'll analyze it instantly. I can extract key information,
                summarize content, identify risks, and answer questions about your documents.
              </Text>
              <TouchableOpacity
                style={styles.aiAssistantButton}
                onPress={handleUploadDocument}
              >
                <Text style={styles.aiAssistantButtonText}>Upload Document</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Paywall Modal */}
      <Paywall
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        feature="document_intelligence"
        title="Document Intelligence"
        description="Transform documents into actionable insights with AI-powered analysis, key point extraction, and smart summaries."
        benefits={[
          'AI document analysis and summaries',
          'Key point extraction',
          'Smart document categorization',
          'Question answering from documents',
          'Batch processing capabilities',
          'Integration with cloud storage'
        ]}
      />
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
  uploadButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  documentsContainer: {
    padding: 16,
  },
  documentCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  documentMeta: {
    flexDirection: 'row',
  },
  documentSize: {
    fontSize: 12,
  },
  documentDate: {
    fontSize: 12,
  },
  confidenceScore: {
    backgroundColor: 'rgba(21, 183, 232, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  aiSummaryContainer: {
    marginBottom: 12,
  },
  aiSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiSummaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  aiSummaryText: {
    fontSize: 14,
    lineHeight: 20,
  },
  keyPointsContainer: {
    marginBottom: 16,
  },
  keyPointsLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  keyPointItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  keyPointBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 6,
    marginRight: 10,
  },
  keyPointText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  documentActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  templatesContainer: {
    padding: 16,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  templateIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  templateContent: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  aiAssistantCard: {
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  aiAssistantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiAssistantTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  aiAssistantText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  aiAssistantButton: {
    backgroundColor: '#FFF7F5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  aiAssistantButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default DocumentIntelligenceScreen;