import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getKnowledgeBase } from '../../utils/sportsKnowledgeBase';

const { width } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const MODEL_OPTIONS = [
  'NFL',
  'NBA',
  'MLB',
  'NHL',
  'MLS',
  'NCAA Football',
  'Premier League',
  'Formula 1',
  'ChatGPT',
];

const BEGINNER_RESPONSES = {
  greeting:
    "Hey there! I'm here to help you understand sports betting and how our charity betting works. What would you like to know?",
  betting:
    "Great question! In our app, you're making predictions about live game events. When you win, coins go to charity - it's betting for good! The money comes from our sponsors, not your wallet.",
  rules:
    'Our betting is simple: watch the game, see a bet pop up, swipe left or right to choose. You earn coins for correct predictions, and all money raised goes to charity. No real money from you!',
  charity:
    'Every bet contributes to our charity pot! Our sponsors fund the actual money - you just predict the outcomes. The more people participate, the more we raise for good causes.',
  coins:
    'Coins are your score! Earn them by making correct predictions. You can see your coin count at the top of the app. They show your betting skills and how much you\'ve helped raise for charity.',
  default:
    "I can help explain betting basics, our charity system, how to earn coins, or any other questions about sports betting. What interests you most?",
};

export default function ChatbotScreen() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: BEGINNER_RESPONSES.greeting,
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>(MODEL_OPTIONS[0]);
  const [showModelPicker, setShowModelPicker] = useState<boolean>(false);
  const [chatId] = useState<string>(() => Date.now().toString());

  const [plays, setPlays] = useState<any[]>([]); // store live play data
  const wsRef = useRef<WebSocket | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);

  // --- connect WebSocket for live plays ---
  // --- connect WebSocket for live plays ---
  useEffect(() => {
    const ws = new WebSocket('ws://10.136.7.78:8080'); // replace with your server IP
    wsRef.current = ws;
  
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'play') {
          // ⬇️ keep the entire JSON payload, not just slices
          setPlays((prev) => [...prev.slice(-9), data]);
        }
      } catch (err) {
        console.error("❌ Error parsing WS message", err);
      }
    };
  
    return () => {
      ws.close();
    };
  }, []);
  
  const generateResponse = async (userMessage: string): Promise<string> => {
    // Turn last 5–10 plays into readable context
    const recentPlays = plays
    .map((p, i) => {
      const clock = p.payload?.clock ?? "—";
      const desc = p.payload?.description ?? "No description available";
      const home = p.homeTeamName ?? "Home";
      const away = p.awayTeamName ?? "Away";
      const homeScore = p.homeTeamScore ?? p.payload?.home_points ?? 0;
      const awayScore = p.awayTeamScore ?? p.payload?.away_points ?? 0;
  
      return `${i + 1}. [${clock}] ${desc} | ${home} ${homeScore} - ${away} ${awayScore}`;
    })
    .join("\n");
  
  
    const requestBody = {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a helpful sports betting guide. 
  Here is the latest play-by-play feed (most recent first):
  ${recentPlays || "No live plays available yet."}
  
  Answer questions using this live context and also explain betting concepts. Keep answers concise (2–4 sentences max) unless the user asks for detail.
  Context for ${selectedModel}: ${getKnowledgeBase(selectedModel)}`,
        },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 200,
    };
  
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });
      const data = await response.json();
      return data.choices?.[0]?.message?.content || 'Sorry, I’m not sure what just happened.';
    } catch (err) {
      console.error('❌ OpenAI error', err);
      return 'Error contacting AI service.';
    }
  };
  
  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const textForResponse = inputText.trim();
    setInputText('');

    const responseText = await generateResponse(textForResponse);

    const botResponse: Message = {
      id: (Date.now() + 1).toString(),
      text: responseText,
      isUser: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, botResponse]);
  };

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSelectModel = (option: string) => {
    setSelectedModel(option);
    setShowModelPicker(false);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top + 60 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.botAvatar}>
          <Ionicons name="chatbubble-ellipses" size={24} color="#EFF6E0" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.botName}>Side Guide</Text>
          <Text style={styles.botStatus}>Online • {selectedModel}</Text>
        </View>

        {/* Model Toggle */}
        <TouchableOpacity
          style={styles.modelToggle}
          onPress={() => setShowModelPicker((s) => !s)}
          accessibilityRole="button"
          accessibilityLabel="Select model"
        >
          <Text style={styles.modelToggleText} numberOfLines={1}>
            {selectedModel}
          </Text>
          <Ionicons
            name={showModelPicker ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#EFF6E0"
            style={{ marginLeft: 4 }}
          />
        </TouchableOpacity>
      </View>

      {/* Dropdown Menu */}
      {showModelPicker && (
        <>
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={() => setShowModelPicker(false)}
          />
          <View style={styles.dropdown}>
            <ScrollView
              style={{ maxHeight: 280 }}
              contentContainerStyle={{ paddingVertical: 6 }}
              showsVerticalScrollIndicator={false}
            >
              {MODEL_OPTIONS.map((opt) => {
                const active = opt === selectedModel;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.dropdownItem, active && styles.dropdownItemActive]}
                    onPress={() => handleSelectModel(opt)}
                  >
                    <Text
                      style={[styles.dropdownText, active && styles.dropdownTextActive]}
                    >
                      {opt}
                    </Text>
                    {active && <Ionicons name="checkmark" size={16} color="#30D158" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </>
      )}

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageContainer,
              message.isUser ? styles.userMessageContainer : styles.botMessageContainer,
            ]}
          >
            {!message.isUser && (
              <View style={styles.botMessageAvatar}>
                <Ionicons name="logo-android" size={16} color="#598392" />
              </View>
            )}

            <View
              style={[
                styles.messageBubble,
                message.isUser ? styles.userMessage : styles.botMessage,
              ]}
            >
              {message.isUser ? (
                <Text style={styles.userMessageText}>{message.text}</Text>
              ) : (
                <LinearGradient
                  colors={['#124559', '#195167ff']}
                  style={styles.botMessageGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.botMessageText}>{message.text}</Text>
                </LinearGradient>
              )}
            </View>

            {message.isUser && (
              <View style={styles.userMessageAvatar}>
                <Ionicons name="person" size={16} color="#01161E" />
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask me about betting..."
            placeholderTextColor="#AEC3B0"
            multiline
            maxLength={200}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendButton, { opacity: inputText.trim() ? 1 : 0.5 }]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={20} color="#EFF6E0" />
          </TouchableOpacity>
        </View>

        <View style={styles.quickQuestions}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              'How does betting work?',
              'What are coins for?',
              'How does charity work?',
              'Betting rules?',
            ].map((question, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickQuestionButton}
                onPress={() => setInputText(question)}
              >
                <Text style={styles.quickQuestionText}>{question}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#01161E' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#124559',
  },
  botAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#124559',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: { flex: 1 },
  botName: { fontSize: 18, fontWeight: '700', color: '#EFF6E0', marginBottom: 2 },
  botStatus: { fontSize: 14, color: '#30D158', fontWeight: '500' },

  modelToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#124559',
    borderWidth: 1,
    borderColor: '#2A5A6A',
  },
  modelToggleText: {
    maxWidth: 110,
    color: '#EFF6E0',
    fontSize: 13,
    fontWeight: '600',
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(1, 22, 30, 0.35)',
  },
  dropdown: {
    position: 'absolute',
    top: 108,
    right: 16,
    width: 220,
    backgroundColor: '#0B2430',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#124559',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    zIndex: 50,
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownItemActive: {
    backgroundColor: 'rgba(48, 209, 88, 0.08)',
  },
  dropdownText: { color: '#EFF6E0', fontSize: 14, fontWeight: '500' },
  dropdownTextActive: { color: '#30D158', fontWeight: '700' },

  messagesContainer: { flex: 1 },
  messagesContent: { paddingVertical: 20, paddingHorizontal: 16 },
  messageContainer: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-end' },
  userMessageContainer: { justifyContent: 'flex-end' },
  botMessageContainer: { justifyContent: 'flex-start' },
  botMessageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#124559',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  userMessageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  messageBubble: { maxWidth: width * 0.75, borderRadius: 20, overflow: 'hidden' },
  userMessage: { backgroundColor: '#598392', paddingHorizontal: 16, paddingVertical: 12 },
  botMessage: {},
  botMessageGradient: { paddingHorizontal: 16, paddingVertical: 12 },
  userMessageText: { fontSize: 16, color: '#EFF6E0', fontWeight: '500', lineHeight: 22 },
  botMessageText: { fontSize: 16, color: '#EFF6E0', fontWeight: '500', lineHeight: 22 },

  inputContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#124559',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#124559',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 12,
  },
  textInput: { flex: 1, fontSize: 16, color: '#EFF6E0', maxHeight: 100, paddingVertical: 8 },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#598392',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  quickQuestions: { paddingLeft: 4 },
  quickQuestionButton: {
    backgroundColor: '#124559',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#598392',
  },
  quickQuestionText: { fontSize: 12, color: '#AEC3B0', fontWeight: '500' },
});
