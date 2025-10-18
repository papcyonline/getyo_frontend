import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { EmailDraft, EmailAddress } from '../types/email';
import emailService from '../services/emailService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

type EmailComposeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EmailCompose'>;
type EmailComposeScreenRouteProp = RouteProp<RootStackParamList, 'EmailCompose'>;

const EmailComposeScreen: React.FC = () => {
  const navigation = useNavigation<EmailComposeScreenNavigationProp>();
  const route = useRoute<EmailComposeScreenRouteProp>();
  const { accountId, replyTo, forward, initialBody } = route.params || {};

  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    // If replying or forwarding, load original email
    if (replyTo || forward) {
      loadOriginalEmail();
    } else if (initialBody) {
      // If initialBody is provided (from smart reply), use it directly
      setBody(initialBody);
    }
  }, [replyTo, forward, initialBody]);

  const loadOriginalEmail = async () => {
    try {
      if (!accountId || (!replyTo && !forward)) return;

      const emailId = replyTo || forward || '';
      const email = await emailService.getEmail(accountId, emailId);

      if (replyTo) {
        setTo(email.from.email);
        setSubject(`Re: ${email.subject.replace(/^Re:\s*/i, '')}`);
        // Only set default body if initialBody was not provided
        if (!initialBody) {
          setBody(`\n\n---\nOn ${new Date(email.date).toLocaleString()}, ${email.from.name || email.from.email} wrote:\n${email.body}`);
        }
      } else if (forward) {
        setSubject(`Fwd: ${email.subject.replace(/^Fwd:\s*/i, '')}`);
        setBody(`\n\n---\nForwarded message:\nFrom: ${email.from.name || email.from.email}\nDate: ${new Date(email.date).toLocaleString()}\nSubject: ${email.subject}\n\n${email.body}`);
      }
    } catch (error: any) {
      console.error('Failed to load original email:', error);
    }
  };

  const parseEmailAddresses = (input: string): EmailAddress[] => {
    return input
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0)
      .map(email => ({ email }));
  };

  const handleSend = async () => {
    // Validation
    if (!accountId) {
      Alert.alert('Error', 'No email account selected');
      return;
    }

    if (!to.trim()) {
      Alert.alert('Error', 'Please enter at least one recipient');
      return;
    }

    if (!subject.trim()) {
      Alert.alert('Error', 'Please enter a subject');
      return;
    }

    if (!body.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSending(true);

    try {
      const draft: EmailDraft = {
        accountId,
        to: parseEmailAddresses(to),
        cc: cc ? parseEmailAddresses(cc) : undefined,
        bcc: bcc ? parseEmailAddresses(bcc) : undefined,
        subject,
        body,
        inReplyTo: replyTo,
        isDraft: false,
      };

      await emailService.sendEmail(accountId, draft);
      Alert.alert('Success', 'Email sent successfully');
      navigation.goBack();
    } catch (error: any) {
      console.error('Failed to send email:', error);
      Alert.alert('Error', error.message || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!accountId) {
      Alert.alert('Error', 'No email account selected');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const draft: EmailDraft = {
        accountId,
        to: parseEmailAddresses(to),
        cc: cc ? parseEmailAddresses(cc) : undefined,
        bcc: bcc ? parseEmailAddresses(bcc) : undefined,
        subject,
        body,
        isDraft: true,
      };

      await emailService.saveDraft(accountId, draft);
      Alert.alert('Success', 'Draft saved');
      navigation.goBack();
    } catch (error: any) {
      console.error('Failed to save draft:', error);
      Alert.alert('Error', 'Failed to save draft');
    }
  };

  const handleDiscard = () => {
    Alert.alert(
      'Discard Email',
      'Are you sure you want to discard this email?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  return (
    <LinearGradient colors={['#000000', '#0A0A0A']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleDiscard} style={styles.headerButton}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Email</Text>
          <TouchableOpacity onPress={handleSaveDraft} style={styles.headerButton}>
            <Ionicons name="save-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>To:</Text>
            <TextInput
              style={styles.fieldInput}
              value={to}
              onChangeText={setTo}
              placeholder="recipient@example.com"
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowCc(!showCc)}
              style={styles.toggleButton}
            >
              <Text style={styles.toggleButtonText}>Cc/Bcc</Text>
            </TouchableOpacity>
          </View>

          {showCc && (
            <>
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Cc:</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={cc}
                  onChangeText={setCc}
                  placeholder="cc@example.com"
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Bcc:</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={bcc}
                  onChangeText={setBcc}
                  placeholder="bcc@example.com"
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </>
          )}

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Subject:</Text>
            <TextInput
              style={styles.fieldInput}
              value={subject}
              onChangeText={setSubject}
              placeholder="Email subject"
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
            />
          </View>

          <View style={styles.bodyContainer}>
            <TextInput
              style={styles.bodyInput}
              value={body}
              onChangeText={setBody}
              placeholder="Write your email here..."
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
              multiline
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        <View style={styles.actionBar}>
          <TouchableOpacity
            onPress={handleSend}
            style={styles.sendButton}
            disabled={sending}
          >
            <LinearGradient
              colors={['#667EEA', '#764BA2']}
              style={styles.sendButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#FFFFFF" />
                  <Text style={styles.sendButtonText}>Send</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  fieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    width: 70,
  },
  fieldInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    paddingVertical: 0,
  },
  toggleButton: {
    marginLeft: 12,
  },
  toggleButtonText: {
    fontSize: 14,
    color: '#667EEA',
    fontWeight: '500',
  },
  bodyContainer: {
    flex: 1,
    marginTop: 20,
  },
  bodyInput: {
    fontSize: 16,
    color: '#FFFFFF',
    minHeight: 200,
    textAlignVertical: 'top',
  },
  actionBar: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  sendButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  sendButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default EmailComposeScreen;
