import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  Share,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RootState } from '../store';
import apiService from '../services/api';

const THEME_GOLD = '#C9A96E';

type RecordingStatus = 'idle' | 'recording' | 'recorded' | 'playing';

const QuickNoteScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const theme = useSelector((state: RootState) => state.theme.theme);

  // Recording states
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('idle');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

  // Content states
  const [aiGeneratedTitle, setAiGeneratedTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [transcript, setTranscript] = useState('');
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);

  // Modal states
  const [showAiActionsModal, setShowAiActionsModal] = useState(false);
  const [showMoreOptionsModal, setShowMoreOptionsModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showSpeedModal, setShowSpeedModal] = useState(false);
  const [newTag, setNewTag] = useState('');

  // Recording history
  const [recordingHistory, setRecordingHistory] = useState([]);
  const [playingHistoryId, setPlayingHistoryId] = useState<string | null>(null);
  const [swipedItemId, setSwipedItemId] = useState<string | null>(null);
  const [historyPlaybackPosition, setHistoryPlaybackPosition] = useState<{ [key: string]: number }>({});
  const [historyPlaybackDuration, setHistoryPlaybackDuration] = useState<{ [key: string]: number }>({});

  // Animation
  const recordingPulse = useRef(new Animated.Value(1)).current;
  const historySoundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    // Request audio permissions and load recordings
    (async () => {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Load existing recordings
      loadRecordings();
    })();

    return () => {
      // Cleanup
      if (recording) {
        recording.stopAndUnloadAsync();
      }
      if (sound) {
        sound.unloadAsync();
      }
      if (historySoundRef.current) {
        historySoundRef.current.unloadAsync();
      }
    };
  }, []);

  const loadRecordings = async () => {
    try {
      const notes = await apiService.getVoiceNotes(20);
      setRecordingHistory(notes);
    } catch (error) {
      console.error('Failed to load recordings:', error);
    }
  };

  useEffect(() => {
    if (recordingStatus === 'recording') {
      // Pulse animation for recording indicator
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordingPulse, {
            toValue: 1.3,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(recordingPulse, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Update duration
      const interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    } else {
      recordingPulse.setValue(1);
    }
  }, [recordingStatus]);

  const startRecording = async () => {
    try {
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setRecordingStatus('recording');
      setRecordingDuration(0);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      // Stop the recording
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordingUri(uri);
      setRecording(null);
      setRecordingStatus('recorded');

      console.log('🎤 Recording stopped, starting transcription...');

      // Transcribe audio using backend API
      const transcriptionResult = await apiService.transcribeAudio(uri);

      if (transcriptionResult && transcriptionResult.text) {
        console.log('✅ Transcription successful:', transcriptionResult.text);

        const fullTranscript = transcriptionResult.text;

        // Generate AI-powered smart title
        console.log('🤖 Generating smart title with AI...');
        const aiTitle = await apiService.generateTitle(fullTranscript);

        const title = aiTitle || fullTranscript.split(/[.!?]/)[0].trim().substring(0, 60) + '...';

        setAiGeneratedTitle(title);
        setEditedTitle(title);
        setTranscript(fullTranscript);

        // Save the recording to the backend
        try {
          const savedNote = await apiService.saveVoiceNote({
            title: title,
            transcript: fullTranscript,
            audioUri: uri,
            duration: recordingDuration,
            tags: tags,
          });

          console.log('✅ Recording saved successfully:', savedNote);

          // Reload recordings to show the new one in history
          loadRecordings();
        } catch (saveError) {
          console.error('❌ Failed to save recording:', saveError);
          Alert.alert('Save Error', 'Recording transcribed but failed to save. Please try again.');
        }
      } else {
        console.warn('⚠️ Transcription returned no text');
        // Fallback to placeholder
        setAiGeneratedTitle('Untitled Recording');
        setEditedTitle('Untitled Recording');
        setTranscript('Failed to transcribe audio. Please try again.');
      }
    } catch (error) {
      console.error('❌ Failed to transcribe recording:', error);
      Alert.alert('Transcription Error', 'Failed to transcribe audio. The recording was saved but transcription failed.');

      // Set fallback values
      setAiGeneratedTitle('Untitled Recording');
      setEditedTitle('Untitled Recording');
      setTranscript('Transcription unavailable.');
    }
  };

  const playRecording = async () => {
    if (!recordingUri) return;

    try {
      if (sound) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          if (isPlaying) {
            await sound.pauseAsync();
            setIsPlaying(false);
          } else {
            await sound.playAsync();
            setIsPlaying(true);
          }
          return;
        }
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recordingUri },
        { shouldPlay: true, rate: playbackSpeed },
        onPlaybackStatusUpdate
      );
      setSound(newSound);
      setIsPlaying(true);
    } catch (error) {
      console.error('Failed to play recording:', error);
      Alert.alert('Error', 'Failed to play recording');
    }
  };

  const changePlaybackSpeed = async (speed: number) => {
    setPlaybackSpeed(speed);
    if (sound) {
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        await sound.setRateAsync(speed, true);
      }
    }
    setShowSpeedModal(false);
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPlaybackPosition(status.positionMillis);
      setPlaybackDuration(status.durationMillis || 0);
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPlaybackPosition(0);
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatMillis = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    return formatDuration(totalSeconds);
  };

  const handleAiAction = (action: string) => {
    setShowAiActionsModal(false);
    // Simulate AI processing
    Alert.alert('Processing', `Generating ${action}...`, [
      { text: 'OK' }
    ]);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${aiGeneratedTitle || 'Recording'}\n\nTranscript:\n${transcript}`,
        title: aiGeneratedTitle || 'Recording',
      });
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  const handleAttachImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setAttachedImages([...attachedImages, result.assets[0].uri]);
    }
    setShowMoreOptionsModal(false);
  };

  const handleDownloadAudio = () => {
    setShowMoreOptionsModal(false);
    Alert.alert('Success', 'Audio downloaded to your device');
  };

  const handleCopyNote = () => {
    setShowMoreOptionsModal(false);
    Alert.alert('Copied', 'Transcript copied to clipboard');
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Recording',
      'Are you sure you want to delete this recording?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setShowMoreOptionsModal(false);
            navigation.goBack();
          }
        }
      ]
    );
  };

  const addTag = () => {
    if (newTag.trim()) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
      setShowTagModal(false);
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handlePlayRecording = async (recordingId: string) => {
    try {
      // Fetch the full recording from backend
      const recording = await apiService.getVoiceNote(recordingId);

      if (!recording) {
        Alert.alert('Error', 'Recording not found');
        return;
      }

      // Clean up transcript (remove old service info if present)
      const cleanTranscript = (transcript: string): string => {
        // Remove "Transcribed using WHISPER" and confidence lines if present
        return transcript
          .replace(/^Transcribed using [A-Z]+\s*\n*/i, '')
          .replace(/^Confidence: \d+\.?\d*%\s*\n*/i, '')
          .trim();
      };

      // Load the recording into the transcript view
      setRecordingUri(recording.audioUri || recording.audioUrl);
      setAiGeneratedTitle(recording.title);
      setEditedTitle(recording.title);
      setTranscript(cleanTranscript(recording.transcript));
      setRecordingDuration(recording.duration);
      setTags(recording.tags || []);
      setRecordingStatus('recorded');

      console.log('✅ Recording loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load recording:', error);
      Alert.alert('Load Error', 'Failed to load recording. Please try again.');
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatFullDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteRecording = (recordingId: string) => {
    Alert.alert(
      'Delete Recording',
      'Are you sure you want to delete this recording?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete from backend
              await apiService.deleteVoiceNote(recordingId);

              // Update local state
              setRecordingHistory(prev => prev.filter(item => item.id !== recordingId));
              setSwipedItemId(null);

              console.log('✅ Recording deleted successfully');
            } catch (error) {
              console.error('❌ Failed to delete recording:', error);
              Alert.alert('Delete Error', 'Failed to delete recording. Please try again.');
            }
          }
        }
      ]
    );
  };

  const toggleHistoryPlayback = async (item: any) => {
    const recordingId = item.id || item._id;
    const audioUri = item.audioUri || item.audioUrl;

    if (!audioUri) {
      Alert.alert('Error', 'Audio file not found');
      return;
    }

    try {
      // If this item is already playing, pause it
      if (playingHistoryId === recordingId) {
        if (historySoundRef.current) {
          await historySoundRef.current.pauseAsync();
          setPlayingHistoryId(null);
        }
        return;
      }

      // Stop any currently playing audio
      if (historySoundRef.current) {
        await historySoundRef.current.unloadAsync();
        historySoundRef.current = null;
      }

      // Load and play the new audio
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true },
        (status: any) => {
          if (status.isLoaded) {
            setHistoryPlaybackPosition(prev => ({
              ...prev,
              [recordingId]: status.positionMillis
            }));
            setHistoryPlaybackDuration(prev => ({
              ...prev,
              [recordingId]: status.durationMillis || item.duration * 1000
            }));
            if (status.didJustFinish) {
              setPlayingHistoryId(null);
              setHistoryPlaybackPosition(prev => ({
                ...prev,
                [recordingId]: 0
              }));
            }
          }
        }
      );

      historySoundRef.current = newSound;
      setPlayingHistoryId(recordingId);
    } catch (error) {
      console.error('Failed to play history item:', error);
      Alert.alert('Error', 'Failed to play recording');
    }
  };

  const seekHistoryAudio = async (recordingId: string, position: number) => {
    if (historySoundRef.current && playingHistoryId === recordingId) {
      try {
        await historySoundRef.current.setPositionAsync(position);
      } catch (error) {
        console.error('Failed to seek:', error);
      }
    }
  };

  const renderRightActions = (recordingId: string) => {
    return (
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteRecording(recordingId)}
      >
        <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              // If viewing a recording detail, go back to the list
              if (recordingStatus === 'recorded') {
                setRecordingStatus('idle');
                setAiGeneratedTitle('');
                setTranscript('');
                setRecordingUri(null);
                setPlaybackPosition(0);
                setPlaybackDuration(0);
                if (sound) sound.unloadAsync();
              } else {
                // Otherwise, navigate back to previous screen
                navigation.goBack();
              }
            }}
          >
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Record</Text>
            {recordingStatus === 'recording' && (
              <Animated.View
                style={[
                  styles.recordingDotSubtle,
                  { transform: [{ scale: recordingPulse }] }
                ]}
              />
            )}
          </View>
          {recordingStatus === 'recorded' ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setRecordingStatus('idle');
                setAiGeneratedTitle('');
                setTranscript('');
                setRecordingUri(null);
                setPlaybackPosition(0);
                setPlaybackDuration(0);
                if (sound) sound.unloadAsync();
              }}
            >
              <Ionicons name="add-circle-outline" size={28} color={THEME_GOLD} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 28 }} />
          )}
        </View>

      {/* Main Content Container with Gray Background */}
      <View style={styles.bottomSheet}>

        {/* Recording Section - Always visible unless showing transcript */}
        {recordingStatus !== 'recorded' && (
          <View style={styles.recordingSection}>
            {/* Recording History */}
            {recordingHistory.length > 0 && (
              <View style={styles.historyContainerTop}>
                <Text style={[styles.historyTitle, { color: theme.text }]}>
                  Previous Recordings
                </Text>
                <ScrollView style={styles.historyList} showsVerticalScrollIndicator={false}>
                  {recordingHistory.map((item, index) => (
                    <View key={item.id || item._id}>
                      <Swipeable
                        renderRightActions={() => renderRightActions(item.id || item._id)}
                        overshootRight={false}
                      >
                        <View style={styles.historyItem}>
                          <View style={styles.historyContent}>
                            {/* Title - Clickable for navigation */}
                            <TouchableOpacity
                              onPress={() => handlePlayRecording(item.id || item._id)}
                              activeOpacity={0.7}
                            >
                              <Text
                                style={[styles.historyItemTitle, { color: theme.text }]}
                                numberOfLines={1}
                              >
                                {item.title || item.text || 'Untitled Recording'}
                              </Text>
                            </TouchableOpacity>

                            {/* Transcript Preview - Clickable for navigation */}
                            {item.transcript && (
                              <TouchableOpacity
                                onPress={() => handlePlayRecording(item.id || item._id)}
                                activeOpacity={0.7}
                              >
                                <Text
                                  style={[styles.historyTranscript, { color: theme.textSecondary }]}
                                  numberOfLines={2}
                                >
                                  {item.transcript}
                                </Text>
                              </TouchableOpacity>
                            )}

                            {/* Compact Play Controls Row with Progress Bar */}
                            <View style={styles.historyPlayRow}>
                              {/* Play/Pause Button */}
                              <TouchableOpacity
                                style={styles.historyPlayButton}
                                onPress={(e) => {
                                  e.stopPropagation();
                                  toggleHistoryPlayback(item);
                                }}
                              >
                                <Ionicons
                                  name={playingHistoryId === (item.id || item._id) ? 'pause' : 'play'}
                                  size={16}
                                  color="#FFFFFF"
                                />
                              </TouchableOpacity>

                              {/* Progress Bar - Seekable */}
                              <TouchableOpacity
                                style={styles.historyProgressBar}
                                activeOpacity={0.8}
                                onPress={(e) => {
                                  const recordingId = item.id || item._id;
                                  const duration = historyPlaybackDuration[recordingId] || item.duration * 1000;
                                  // Calculate position based on touch location
                                  // @ts-ignore
                                  const touchX = e.nativeEvent.locationX;
                                  // @ts-ignore
                                  const barWidth = e.nativeEvent.target.offsetWidth || 200;
                                  const percentage = touchX / barWidth;
                                  const newPosition = duration * percentage;
                                  seekHistoryAudio(recordingId, newPosition);
                                }}
                              >
                                <View style={styles.historyProgressBackground}>
                                  <View
                                    style={[
                                      styles.historyProgressFill,
                                      {
                                        width: `${
                                          (historyPlaybackDuration[item.id || item._id] || 0) > 0
                                            ? ((historyPlaybackPosition[item.id || item._id] || 0) /
                                              (historyPlaybackDuration[item.id || item._id] || 1)) * 100
                                            : 0
                                        }%`
                                      }
                                    ]}
                                  />
                                </View>
                              </TouchableOpacity>

                              {/* Duration */}
                              <Text style={[styles.historyDuration, { color: theme.text }]}>
                                {playingHistoryId === (item.id || item._id) && historyPlaybackPosition[item.id || item._id]
                                  ? formatMillis(historyPlaybackPosition[item.id || item._id])
                                  : formatDuration(item.duration || 0)}
                              </Text>

                              {/* Speed Badge */}
                              <View style={styles.historySpeedBadge}>
                                <Text style={[styles.historySpeedText, { color: THEME_GOLD }]}>
                                  1.0x
                                </Text>
                              </View>

                              {/* Date */}
                              <Text style={[styles.historyDate, { color: theme.textSecondary }]}>
                                {formatTimeAgo(new Date(item.createdAt || item.timestamp))}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </Swipeable>
                      {index < recordingHistory.length - 1 && (
                        <View style={styles.historyDivider} />
                      )}
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Main Action Button with Instructions */}
            <View style={styles.recordButtonContainer}>
              {recordingStatus === 'idle' ? (
                <>
                  <Text style={[styles.instructionText, { color: theme.text }]}>
                    Tap to start recording
                  </Text>
                  <TouchableOpacity
                    style={styles.mainActionButton}
                    onPress={startRecording}
                  >
                    <Ionicons name="mic" size={28} color="#FFFFFF" />
                  </TouchableOpacity>
                  <Text style={[styles.subInstructionText, { color: theme.textSecondary }]}>
                    Record a meeting, discussion, or voice note
                  </Text>
                </>
              ) : (
                <>
                  <Text style={[styles.recordingTimeDisplay, { color: theme.text }]}>
                    {formatDuration(recordingDuration)}
                  </Text>
                  <View style={styles.recordingControls}>
                    <TouchableOpacity
                      style={[styles.controlButton, styles.stopButton]}
                      onPress={stopRecording}
                    >
                      <Ionicons name="stop" size={24} color="#FFFFFF" />
                      <Text style={styles.controlButtonText}>Stop</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        {recordingStatus === 'recorded' && (
          <View style={styles.recordedContainer}>
            {/* Title Section */}
            <View style={styles.titleSection}>
              {isEditingTitle ? (
                <View style={styles.titleEditContainer}>
                  <TextInput
                    style={[styles.titleInput, { color: theme.text, backgroundColor: '#1A1A1A', borderColor: THEME_GOLD }]}
                    value={editedTitle}
                    onChangeText={setEditedTitle}
                    autoFocus
                    multiline
                  />
                  <TouchableOpacity
                    style={styles.titleSaveButton}
                    onPress={() => {
                      setAiGeneratedTitle(editedTitle);
                      setIsEditingTitle(false);
                    }}
                  >
                    <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.titleDisplay}
                  onPress={() => setIsEditingTitle(true)}
                >
                  <Text style={[styles.titleTextLarge, { color: theme.text }]}>
                    {aiGeneratedTitle}
                  </Text>
                  <Ionicons name="pencil" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Transcript Section - Scrollable */}
            <View style={styles.transcriptSection}>
              <ScrollView
                style={styles.transcriptScroll}
                showsVerticalScrollIndicator={true}
              >
                <Text style={[styles.transcriptText, { color: theme.textSecondary }]}>
                  {transcript}
                </Text>
              </ScrollView>
            </View>

            {/* Audio Player */}
            <View style={styles.audioPlayer}>
              <TouchableOpacity
                style={styles.playButton}
                onPress={playRecording}
              >
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={18}
                  color="#FFFFFF"
                />
              </TouchableOpacity>

              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${playbackDuration > 0
                          ? (playbackPosition / playbackDuration) * 100
                          : 0}%`
                      }
                    ]}
                  />
                </View>
                <Text style={[styles.audioTimeSmall, { color: theme.textSecondary }]}>
                  {formatMillis(playbackPosition)} / {formatMillis(playbackDuration || recordingDuration * 1000)}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.speedButtonCompact}
                onPress={() => setShowSpeedModal(true)}
              >
                <Text style={[styles.speedTextCompact, { color: THEME_GOLD }]}>
                  {playbackSpeed}x
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeButtonCompact}
                onPress={() => {
                  setRecordingStatus('idle');
                  setAiGeneratedTitle('');
                  setTranscript('');
                  setRecordingUri(null);
                  setPlaybackPosition(0);
                  setPlaybackDuration(0);
                  if (sound) sound.unloadAsync();
                }}
              >
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Action Icons Grid */}
            <View style={[styles.actionIconsGrid, { paddingBottom: insets.bottom + 20 }]}>
              <TouchableOpacity
                style={styles.actionIcon}
                onPress={() => setShowAiActionsModal(true)}
              >
                <View style={styles.iconButton}>
                  <Ionicons name="sparkles" size={24} color={THEME_GOLD} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionIcon}
                onPress={handleShare}
              >
                <View style={styles.iconButton}>
                  <Ionicons name="share-outline" size={24} color={THEME_GOLD} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionIcon}
                onPress={() => { setShowMoreOptionsModal(false); setShowTagModal(true); }}
              >
                <View style={styles.iconButton}>
                  <Ionicons name="pricetag-outline" size={24} color={THEME_GOLD} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionIcon}
                onPress={handleDownloadAudio}
              >
                <View style={styles.iconButton}>
                  <Ionicons name="download-outline" size={24} color={THEME_GOLD} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionIcon}
                onPress={() => setShowMoreOptionsModal(true)}
              >
                <View style={styles.iconButton}>
                  <Ionicons name="ellipsis-horizontal" size={24} color={THEME_GOLD} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* AI Actions Modal */}
      {showAiActionsModal && (
        <Modal visible={showAiActionsModal} transparent={true} animationType="slide">
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.modalBackground}
              onPress={() => setShowAiActionsModal(false)}
            />
            <View style={[styles.slideUpModal, { paddingBottom: insets.bottom + 20 }]}>
              <View style={styles.slideUpHeader}>
                <View style={styles.slideUpHandle} />
                <Text style={[styles.slideUpTitle, { color: theme.text }]}>
                  AI Actions
                </Text>
              </View>
              <View style={styles.slideUpContent}>
                {[
                  { icon: 'document-text-outline', label: 'Meeting Summary', action: 'summary' },
                  { icon: 'list-outline', label: 'Generate To-Do List', action: 'todo' },
                  { icon: 'bulb-outline', label: 'Extract Main Points', action: 'points' },
                  { icon: 'language-outline', label: 'Translate', action: 'translate' },
                ].map((item, index) => (
                  <React.Fragment key={item.action}>
                    <TouchableOpacity
                      style={styles.modalOption}
                      onPress={() => handleAiAction(item.label)}
                    >
                      <View style={styles.modalOptionIcon}>
                        <Ionicons name={item.icon as any} size={24} color={THEME_GOLD} />
                      </View>
                      <Text style={[styles.modalOptionText, { color: theme.text }]}>
                        {item.label}
                      </Text>
                      <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                    </TouchableOpacity>
                    {index < 3 && <View style={styles.modalDivider} />}
                  </React.Fragment>
                ))}
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* More Options Modal */}
      {showMoreOptionsModal && (
        <Modal visible={showMoreOptionsModal} transparent={true} animationType="slide">
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.modalBackground}
              onPress={() => setShowMoreOptionsModal(false)}
            />
            <View style={[styles.slideUpModal, { paddingBottom: insets.bottom + 20 }]}>
              <View style={styles.slideUpHeader}>
                <View style={styles.slideUpHandle} />
                <Text style={[styles.slideUpTitle, { color: theme.text }]}>
                  More Options
                </Text>
              </View>
              <View style={styles.slideUpContent}>
                {[
                  { icon: 'pencil-outline', label: 'Edit', action: () => setIsEditingTitle(true) },
                  { icon: 'pricetag-outline', label: 'Add Tag', action: () => { setShowMoreOptionsModal(false); setShowTagModal(true); } },
                  { icon: 'image-outline', label: 'Attach Image', action: handleAttachImage },
                  { icon: 'download-outline', label: 'Download Audio', action: handleDownloadAudio },
                  { icon: 'copy-outline', label: 'Copy Note', action: handleCopyNote },
                  { icon: 'trash-outline', label: 'Delete', action: handleDelete, color: '#FF4757' },
                ].map((item, index) => (
                  <React.Fragment key={item.label}>
                    <TouchableOpacity
                      style={styles.modalOption}
                      onPress={() => {
                        setShowMoreOptionsModal(false);
                        item.action();
                      }}
                    >
                      <View style={[styles.modalOptionIcon, item.color && { backgroundColor: `${item.color}20` }]}>
                        <Ionicons
                          name={item.icon as any}
                          size={24}
                          color={item.color || THEME_GOLD}
                        />
                      </View>
                      <Text style={[styles.modalOptionText, { color: item.color || theme.text }]}>
                        {item.label}
                      </Text>
                      <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                    </TouchableOpacity>
                    {index < 5 && <View style={styles.modalDivider} />}
                  </React.Fragment>
                ))}
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Tag Modal */}
      {showTagModal && (
        <Modal visible={showTagModal} transparent={true} animationType="slide">
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.modalBackground}
              onPress={() => setShowTagModal(false)}
            />
            <View style={[styles.slideUpModal, { paddingBottom: insets.bottom + 20 }]}>
              <View style={styles.slideUpHeader}>
                <TouchableOpacity
                  onPress={() => setShowTagModal(false)}
                  style={{ position: 'absolute', left: 20, zIndex: 10 }}
                >
                  <Text style={[styles.modalButton, { color: theme.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <View style={styles.slideUpHandle} />
                <Text style={[styles.slideUpTitle, { color: theme.text }]}>Add Tag</Text>
                <TouchableOpacity
                  onPress={addTag}
                  style={{ position: 'absolute', right: 20, zIndex: 10 }}
                >
                  <Text style={[styles.modalButton, { color: THEME_GOLD, fontWeight: '600' }]}>Done</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.slideUpContent}>
                <TextInput
                  style={[styles.tagInput, { color: theme.text, backgroundColor: '#1A1A1A', borderColor: '#3A3A3A' }]}
                  placeholder="Enter tag name..."
                  placeholderTextColor={theme.textSecondary}
                  value={newTag}
                  onChangeText={setNewTag}
                  autoFocus
                />
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Speed Modal */}
      {showSpeedModal && (
        <Modal visible={showSpeedModal} transparent={true} animationType="slide">
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.modalBackground}
              onPress={() => setShowSpeedModal(false)}
            />
            <View style={[styles.slideUpModal, { paddingBottom: insets.bottom + 20 }]}>
              <View style={styles.slideUpHeader}>
                <View style={styles.slideUpHandle} />
                <Text style={[styles.slideUpTitle, { color: theme.text }]}>Playback Speed</Text>
              </View>
              <View style={styles.slideUpContent}>
                {[0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0].map((speed, index) => (
                  <React.Fragment key={speed}>
                    <TouchableOpacity
                      style={styles.modalOption}
                      onPress={() => changePlaybackSpeed(speed)}
                    >
                      <View style={[styles.modalOptionIcon, playbackSpeed === speed && { backgroundColor: `${THEME_GOLD}30` }]}>
                        <Text style={[styles.speedOptionText, { color: playbackSpeed === speed ? THEME_GOLD : theme.text }]}>
                          {speed}x
                        </Text>
                      </View>
                      <Text style={[styles.modalOptionText, { color: playbackSpeed === speed ? THEME_GOLD : theme.text }]}>
                        {speed === 1.0 ? 'Normal' : speed < 1.0 ? 'Slower' : 'Faster'}
                      </Text>
                      {playbackSpeed === speed && (
                        <Ionicons name="checkmark-circle" size={24} color={THEME_GOLD} />
                      )}
                    </TouchableOpacity>
                    {index < 6 && <View style={styles.modalDivider} />}
                  </React.Fragment>
                ))}
              </View>
            </View>
          </View>
        </Modal>
      )}
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  recordingDotSubtle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4757',
  },
  bottomSheet: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 12,
  },
  recordingTimeDisplay: {
    fontSize: 32,
    fontWeight: '300',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 2,
  },
  recordingSection: {
    flex: 1,
    paddingBottom: 20,
  },
  recordButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingBottom: 20,
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  subInstructionText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 32,
  },
  recordingControls: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 25,
    gap: 8,
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  mainActionButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: THEME_GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: THEME_GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  stopButton: {
    backgroundColor: '#FF4757',
    shadowColor: '#FF4757',
  },
  recordedContainer: {
    flex: 1,
  },
  titleSection: {
    marginBottom: 16,
  },
  titleEditContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 22,
    fontWeight: '700',
    maxHeight: 120,
  },
  titleSaveButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME_GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleDisplay: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleTextLarge: {
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
    lineHeight: 32,
  },
  transcriptSection: {
    flex: 1,
    marginBottom: 12,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
  },
  transcriptScroll: {
    flex: 1,
  },
  transcriptText: {
    fontSize: 15,
    lineHeight: 22,
  },
  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 16,
    gap: 12,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME_GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarContainer: {
    flex: 1,
    gap: 6,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: THEME_GOLD,
    borderRadius: 2,
  },
  audioTimeSmall: {
    fontSize: 11,
    fontWeight: '500',
  },
  speedButtonCompact: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: `${THEME_GOLD}20`,
    borderRadius: 12,
  },
  speedTextCompact: {
    fontSize: 12,
    fontWeight: '700',
  },
  closeButtonCompact: {
    padding: 6,
  },
  actionIconsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
  },
  actionIcon: {
    alignItems: 'center',
  },
  iconButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${THEME_GOLD}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  slideUpModal: {
    backgroundColor: '#2A2A2A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
  },
  slideUpHeader: {
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  slideUpHandle: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginBottom: 12,
  },
  slideUpTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  slideUpContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  modalOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${THEME_GOLD}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  modalOptionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  modalDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginLeft: 60,
  },
  modalButton: {
    fontSize: 17,
  },
  tagInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  speedOptionText: {
    fontSize: 16,
    fontWeight: '700',
  },
  historyContainerTop: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 8,
    paddingTop: 4,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    paddingLeft: 8,
  },
  historyList: {
    flex: 1,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 8,
    gap: 12,
    backgroundColor: '#2A2A2A',
  },
  historyContent: {
    flex: 1,
    gap: 8,
  },
  historyItemTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 4,
  },
  historyTranscript: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  historyPlayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'nowrap',
  },
  historyProgressBar: {
    flex: 1,
    minWidth: 60,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  historyProgressBackground: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  historyProgressFill: {
    height: '100%',
    backgroundColor: THEME_GOLD,
    borderRadius: 2,
  },
  historyPlayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME_GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  historyDuration: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 38,
    flexShrink: 0,
  },
  historySpeedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: `${THEME_GOLD}20`,
    borderRadius: 6,
    flexShrink: 0,
  },
  historySpeedText: {
    fontSize: 10,
    fontWeight: '700',
  },
  historyDate: {
    fontSize: 11,
    flexShrink: 0,
  },
  historyDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginLeft: 60,
  },
  deleteButton: {
    backgroundColor: '#FF4757',
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    height: '100%',
    gap: 4,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default QuickNoteScreen;
