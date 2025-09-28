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

// Cohesive palette
const C_BG = '#01161E';
const C_CARD = '#0F2830';
const C_BORDER = 'rgba(255,255,255,0.08)';
const C_BORDER_STRONG = 'rgba(255,255,255,0.12)';
const C_TEXT = '#EFF6E0';
const C_SUB = '#AEC3B0';

// Brighter purple (matches your stat bars vibe)
const C_PURPLE = '#7B6CF6';   // brighter than before
const C_PURPLE_TINT = 'rgba(123,108,246,0.12)';

// Subtle bot bubble gradient
const G_BOT = ['#10343C', '#0F2830'];

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const MODEL_OPTIONS = [
  'NFL','NBA','MLB','NHL','MLS','NCAA Football','Premier League','Formula 1','General',
];

const BEGINNER_RESPONSES = {
  greeting:
    "Hey there! I'm here to help you understand sports betting and how our charity betting works. What would you like to know?",
  betting:
    "Great question! In our app, you're making predictions about live game events. When you win, coins go to charity — it's betting for good! The money comes from our sponsors, not your wallet.",
  rules:
    'Our betting is simple: watch the game, see a bet pop up, swipe left or right to choose. You earn coins for correct predictions, and all money raised goes to charity. No real money from you!',
  charity:
    'Every bet contributes to our charity pot! Our sponsors fund the actual money — you just predict the outcomes. The more people participate, the more we raise for good causes.',
  coins:
    "Coins are your score! Earn them by making correct predictions. They show your betting skills and how much you've helped raise for charity.",
  default:
    'I can help explain betting basics, our charity system, how to earn coins, or anything else about sports betting. What interests you most?',
};

export default function ChatbotScreen() {
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: BEGINNER_RESPONSES.greeting, isUser: false, timestamp: new Date() },
  ]);
  const [inputText, setInputText] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>(MODEL_OPTIONS[0]);
  const [showModelPicker, setShowModelPicker] = useState<boolean>(false);
  const [chatId] = useState<string>(() => Date.now().toString());

  const scrollViewRef = useRef<ScrollView>(null);

  const generateResponse = async (userMessage: string): Promise<string> => {
    try {
      const requestBody = {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a helpful side guide for a charity betting app. Keep responses concise and friendly. Context for ${selectedModel}: ${getKnowledgeBase(selectedModel)}`
          },
          { role: 'user', content: userMessage }
        ],
        max_tokens: 150,
      };

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      if (!response.ok) {
        return `API Error: ${data.error?.message || 'Unknown error'}`;
      }
      return data.choices?.[0]?.message?.content || 'Sorry, I had trouble understanding that.';
    } catch {
      return "Sorry, I'm having trouble connecting right now. Please try again later.";
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
      style={[styles.container, { paddingTop: insets.top + 20 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.botAvatar}>
          <Ionicons name="chatbubble-ellipses" size={22} color={C_TEXT} />
        </View>

        <View style={styles.headerText}>
          <Text style={styles.botName}>Side Guide</Text>
          {/* Make status purple */}
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
            color={C_TEXT}
            style={{ marginLeft: 4 }}
          />
        </TouchableOpacity>
      </View>

      {/* Dropdown Menu + Overlay */}
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
                    <Text style={[styles.dropdownText, active && styles.dropdownTextActive]}>
                      {opt}
                    </Text>
                    {active && <Ionicons name="checkmark" size={16} color={C_PURPLE} />}
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
                <Ionicons name="logo-android" size={16} color={C_SUB} />
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
                  colors={G_BOT}
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
                <Ionicons name="person" size={16} color={C_BG} />
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        {/* Quick prompts */}
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

        {/* Composer */}
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask me about betting..."
            placeholderTextColor={C_SUB}
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
            <Ionicons name="send" size={20} color={C_TEXT} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C_BG },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C_BORDER,
  },
  botAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C_CARD,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: C_BORDER,
  },
  headerText: { flex: 1 },
  botName: { fontSize: 18, fontWeight: '800', color: C_TEXT, marginBottom: 2 },
  // Make status purple
  botStatus: { fontSize: 14, color: C_PURPLE, fontWeight: '800' },

  modelToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: C_CARD,
    borderWidth: 1,
    borderColor: C_BORDER,
  },
  modelToggleText: {
    maxWidth: 110,
    color: C_TEXT,
    fontSize: 13,
    fontWeight: '700',
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(1, 22, 30, 0.35)',
  },
  dropdown: {
    position: 'absolute',
    top: 92,
    right: 16,
    width: 220,
    backgroundColor: C_CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C_BORDER,
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
  dropdownItemActive: { backgroundColor: C_PURPLE_TINT },
  dropdownText: { color: C_TEXT, fontSize: 14, fontWeight: '600' },
  dropdownTextActive: { color: C_PURPLE, fontWeight: '800' },

  messagesContainer: { flex: 1 },
  messagesContent: { paddingVertical: 20, paddingHorizontal: 16 },
  messageContainer: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-end' },
  userMessageContainer: { justifyContent: 'flex-end' },
  botMessageContainer: { justifyContent: 'flex-start' },

  botMessageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C_CARD,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: C_BORDER,
  },
  userMessageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C_TEXT,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  messageBubble: {
    maxWidth: width * 0.75,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C_BORDER,
  },
  userMessage: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  botMessage: { backgroundColor: C_CARD },
  botMessageGradient: { paddingHorizontal: 16, paddingVertical: 12 },

  userMessageText: { fontSize: 16, color: C_TEXT, fontWeight: '500', lineHeight: 22 },
  botMessageText: { fontSize: 16, color: C_TEXT, fontWeight: '500', lineHeight: 22 },

  inputContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 0,         // remove tiny divider line above prompts
    backgroundColor: C_BG,
  },
  quickQuestions: { paddingLeft: 4, marginBottom: 12 },
  quickQuestionButton: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    borderWidth: 1,
    borderColor: C_BORDER,
  },
  quickQuestionText: { fontSize: 12, color: C_SUB, fontWeight: '600' },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: C_CARD,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: C_BORDER,
  },
  textInput: { flex: 1, fontSize: 16, color: C_TEXT, maxHeight: 100, paddingVertical: 6 },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C_PURPLE,      // brighter purple
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    shadowColor: C_PURPLE,          // subtle glow to read as brighter
    shadowOpacity: 0.6,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
});
