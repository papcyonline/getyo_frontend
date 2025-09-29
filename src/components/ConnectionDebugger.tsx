import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ConnectionManager from '../services/connectionManager';

interface ConnectionDebuggerProps {
  visible: boolean;
  onClose: () => void;
}

const ConnectionDebugger: React.FC<ConnectionDebuggerProps> = ({ visible, onClose }) => {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(ConnectionManager.getStatus());

  useEffect(() => {
    // Listen for connection status changes
    const unsubscribe = ConnectionManager.addStatusListener((status) => {
      setConnectionStatus(status);
    });

    // Load initial diagnostics
    loadDiagnostics();

    return unsubscribe;
  }, []);

  const loadDiagnostics = async () => {
    try {
      const diag = await ConnectionManager.getDiagnostics();
      setDiagnostics(diag);
    } catch (error) {
      console.error('Failed to load diagnostics:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await ConnectionManager.refresh();
      await loadDiagnostics();
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAttemptFix = async () => {
    try {
      const result = await ConnectionManager.attemptFix();

      Alert.alert(
        result.success ? '✅ Fix Attempt' : '❌ Fix Attempt',
        result.message,
        [
          {
            text: 'View Details',
            onPress: () => {
              Alert.alert(
                'Fix Actions',
                result.actions.join('\\n'),
                [{ text: 'OK' }]
              );
            }
          },
          { text: 'OK' }
        ]
      );

      await loadDiagnostics();
    } catch (error) {
      Alert.alert('Error', 'Failed to attempt fix: ' + error);
    }
  };

  const getStatusColor = (status: boolean) => {
    return status ? '#4CAF50' : '#F44336';
  };

  const getStatusIcon = (status: boolean) => {
    return status ? 'checkmark-circle' : 'close-circle';
  };

  const formatJSON = (obj: any) => {
    return JSON.stringify(obj, null, 2);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Connection Debugger</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Connection Status Overview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Connection Status</Text>
            <View style={styles.statusGrid}>
              <View style={styles.statusItem}>
                <Ionicons
                  name={getStatusIcon(connectionStatus.network)}
                  size={20}
                  color={getStatusColor(connectionStatus.network)}
                />
                <Text style={styles.statusLabel}>Network</Text>
              </View>
              <View style={styles.statusItem}>
                <Ionicons
                  name={getStatusIcon(connectionStatus.api)}
                  size={20}
                  color={getStatusColor(connectionStatus.api)}
                />
                <Text style={styles.statusLabel}>API</Text>
              </View>
              <View style={styles.statusItem}>
                <Ionicons
                  name={getStatusIcon(connectionStatus.socket)}
                  size={20}
                  color={getStatusColor(connectionStatus.socket)}
                />
                <Text style={styles.statusLabel}>Socket</Text>
              </View>
            </View>
            <Text style={styles.overallStatus}>
              Overall: {connectionStatus.overall.toUpperCase()}
            </Text>
            <Text style={styles.lastChecked}>
              Last checked: {new Date(connectionStatus.lastChecked).toLocaleString()}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions</Text>
            <TouchableOpacity style={styles.actionButton} onPress={handleRefresh}>
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Refresh Status</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.fixButton]} onPress={handleAttemptFix}>
              <Ionicons name="build" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Attempt Fix</Text>
            </TouchableOpacity>
          </View>

          {/* Detailed Diagnostics */}
          {diagnostics && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Network Details</Text>
                <View style={styles.codeBlock}>
                  <Text style={styles.codeText}>
                    {formatJSON(diagnostics.network)}
                  </Text>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>API Details</Text>
                <View style={styles.codeBlock}>
                  <Text style={styles.codeText}>
                    {formatJSON(diagnostics.api)}
                  </Text>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Authentication</Text>
                <View style={styles.codeBlock}>
                  <Text style={styles.codeText}>
                    {formatJSON(diagnostics.auth)}
                  </Text>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Locale</Text>
                <View style={styles.codeBlock}>
                  <Text style={styles.codeText}>
                    {formatJSON(diagnostics.locale)}
                  </Text>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statusItem: {
    alignItems: 'center',
  },
  statusLabel: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
  },
  overallStatus: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  lastChecked: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  fixButton: {
    backgroundColor: '#FF9800',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  codeBlock: {
    backgroundColor: '#f8f8f8',
    borderRadius: 4,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#333',
  },
});

export default ConnectionDebugger;