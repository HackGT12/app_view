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

const { width } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const BEGINNER_RESPONSES = {
  greeting: "Hey there! I'm here to help you understand sports betting and how our charity betting works. What would you like to know?",
  
  betting: "Great question! In our app, you're making predictions about live game events. When you win, coins go to charity - it's betting for good! The money comes from our sponsors, not your wallet.",
  
  rules: "Our betting is simple: watch the game, see a bet pop up, swipe left or right to choose. You earn coins for correct predictions, and all money raised goes to charity. No real money from you!",
  
  charity: "Every bet contributes to our charity pot! Our sponsors fund the actual money - you just predict the outcomes. The more people participate, the more we raise for good causes.",
  
  coins: "Coins are your score! Earn them by making correct predictions. You can see your coin count at the top of the app. They show your betting skills and how much you've helped raise for charity.",
  
  default: "I can help explain betting basics, our charity system, how to earn coins, or any other questions about sports betting. What interests you most?"
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
  const scrollViewRef = useRef<ScrollView>(null);

  const generateResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('hi') || message.includes('hello') || message.includes('hey')) {
      return BEGINNER_RESPONSES.greeting;
    }
    
    if (message.includes('bet') || message.includes('betting') || message.includes('how')) {
      return BEGINNER_RESPONSES.betting;
    }
    
    if (message.includes('rule') || message.includes('work') || message.includes('play')) {
      return BEGINNER_RESPONSES.rules;
    }
    
    if (message.includes('charity') || message.includes('money') || message.includes('sponsor')) {
      return BEGINNER_RESPONSES.charity;
    }
    
    if (message.includes('coin') || message.includes('point') || message.includes('score')) {
      return BEGINNER_RESPONSES.coins;
    }
    
    return BEGINNER_RESPONSES.default;
  };

  const sendMessage = () => {
    if (inputText.trim()) {
      const userMessage: Message = {
        id: Date.now().toString(),
        text: inputText.trim(),
        isUser: true,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, userMessage]);
      setInputText('');
      
      // Simulate bot response delay
      setTimeout(() => {
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: generateResponse(inputText),
          isUser: false,
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, botResponse]);
      }, 1000);
    }
  };

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top + 60 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <View style={styles.botAvatar}>
          <Ionicons name="chatbubble-ellipses" size={24} color="#EFF6E0" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.botName}>Sports Betting Assistant</Text>
          <Text style={styles.botStatus}>Online • Ready to help</Text>
        </View>
      </View>

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
                  colors={['#124559', '#598392']}
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
            style={[
              styles.sendButton,
              { opacity: inputText.trim() ? 1 : 0.5 }
            ]}
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
  container: {
    flex: 1,
    backgroundColor: '#01161E',
  },
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
  headerText: {
    flex: 1,
  },
  botName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#EFF6E0',
    marginBottom: 2,
  },
  botStatus: {
    fontSize: 14,
    color: '#30D158',
    fontWeight: '500',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  botMessageContainer: {
    justifyContent: 'flex-start',
  },
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
  messageBubble: {
    maxWidth: width * 0.75,
    borderRadius: 20,
    overflow: 'hidden',
  },
  userMessage: {
    backgroundColor: '#598392',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  botMessage: {
    // LinearGradient will handle the styling
  },
  botMessageGradient: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userMessageText: {
    fontSize: 16,
    color: '#EFF6E0',
    fontWeight: '500',
    lineHeight: 22,
  },
  botMessageText: {
    fontSize: 16,
    color: '#EFF6E0',
    fontWeight: '500',
    lineHeight: 22,
  },
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
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#EFF6E0',
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#598392',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  quickQuestions: {
    paddingLeft: 4,
  },
  quickQuestionButton: {
    backgroundColor: '#124559',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#598392',
  },
  quickQuestionText: {
    fontSize: 12,
    color: '#AEC3B0',
    fontWeight: '500',
  },
});
