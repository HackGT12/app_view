import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Modal } from 'react-native';
import Slider from '@react-native-community/slider';
import { FirebaseService } from '../utils/firebaseService';

interface GroupLine {
  id: string;
  active: boolean;
  max: number;
  min: number;
  question: string;
  actual?: number;
  createdBy?: string;
}

interface PlayerResponse {
  type: 'over' | 'under';
  line: number;
}

interface GameScores {
  homeTeamScore?: number;
  awayTeamScore?: number;
}

interface LiveBetsTabProps {
  groupLines: GroupLine[];
  playerResponses: {[key: string]: PlayerResponse};
  customLines: {[key: string]: number};
  selectedTypes: {[key: string]: 'over' | 'under'};
  gameScores: GameScores;
  userId?: string;
  onConfirmBet: (lineId: string) => void;
  onSetCustomLine: (lineId: string, value: number) => void;
  onSelectType: (lineId: string, type: 'over' | 'under') => void;
  onCreateBet: () => void;
  onSetAnswer: (lineId: string) => void;
  createBetModal: boolean;
  setCreateBetModal: (visible: boolean) => void;
  newBetQuestion: string;
  setNewBetQuestion: (value: string) => void;
  newBetMin: string;
  setNewBetMin: (value: string) => void;
  newBetMax: string;
  setNewBetMax: (value: string) => void;
  handleCreateBet: () => void;
  answerModal: boolean;
  setAnswerModal: (visible: boolean) => void;
  answerValue: string;
  setAnswerValue: (value: string) => void;
  handleSetAnswer: () => void;
}

const LiveBetsTab: React.FC<LiveBetsTabProps> = ({
  groupLines,
  playerResponses,
  customLines,
  selectedTypes,
  gameScores,
  userId,
  onConfirmBet,
  onSetCustomLine,
  onSelectType,
  onCreateBet,
  onSetAnswer,
  createBetModal,
  setCreateBetModal,
  newBetQuestion,
  setNewBetQuestion,
  newBetMin,
  setNewBetMin,
  newBetMax,
  setNewBetMax,
  handleCreateBet,
  answerModal,
  setAnswerModal,
  answerValue,
  setAnswerValue,
  handleSetAnswer,
}) => {
  return (
    <View style={styles.betsSection}>
      {gameScores.homeTeamScore !== undefined && (
        <View style={styles.liveScoreContainer}>
          <Text style={styles.liveScoreTitle}>Live Score</Text>
          <View style={styles.scoreDisplay}>
            <View style={styles.scoreTeam}>
              <Text style={styles.scoreTeamName}>Falcons</Text>
              <Text style={styles.scoreNumber}>{gameScores.homeTeamScore}</Text>
            </View>
            <Text style={styles.scoreSeparator}>-</Text>
            <View style={styles.scoreTeam}>
              <Text style={styles.scoreTeamName}>Buccaneers</Text>
              <Text style={styles.scoreNumber}>{gameScores.awayTeamScore || 0}</Text>
            </View>
          </View>
        </View>
      )}
      
      <View style={styles.betsHeader}>
        <Text style={styles.sectionTitle}>Active Live Bets</Text>
        <TouchableOpacity 
          style={styles.createBetButton}
          onPress={onCreateBet}
        >
          <Text style={styles.createBetButtonText}>+ Create Bet</Text>
        </TouchableOpacity>
      </View>
      
      {groupLines.filter(line => line.active).map((groupLine) => {
        const playerResponse = playerResponses[groupLine.id];
        const hasAnswered = !!playerResponse;
        
        return (
          <View key={groupLine.id} style={styles.betCard}>
            <View style={styles.betCardHeader}>
              <Text style={styles.questionText}>{groupLine.question}</Text>
              <Text style={styles.rangeText}>Range: {groupLine.min} - {groupLine.max}</Text>
              {groupLine.createdBy === userId && groupLine.active && (
                <TouchableOpacity 
                  style={styles.setAnswerButton}
                  onPress={() => onSetAnswer(groupLine.id)}
                >
                  <Text style={styles.setAnswerButtonText}>Set Answer</Text>
                </TouchableOpacity>
              )}
              {groupLine.actual !== undefined && (
                <Text style={styles.actualText}>Actual: {groupLine.actual}</Text>
              )}
            </View>
            
            {hasAnswered ? (
              <View style={styles.answeredContainer}>
                <View style={styles.answeredBadge}>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
                <Text style={styles.answeredText}>
                  Your bet: {playerResponse.type.toUpperCase()} {playerResponse.line}
                </Text>
              </View>
            ) : (
              <View style={styles.bettingInterface}>
                <View style={styles.optionsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.optionButton,
                      styles.overButton,
                      selectedTypes[groupLine.id] === 'over' && styles.selectedOver
                    ]}
                    onPress={() => onSelectType(groupLine.id, 'over')}
                  >
                    <Text style={styles.optionLabel}>OVER</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.optionButton,
                      styles.underButton,
                      selectedTypes[groupLine.id] === 'under' && styles.selectedUnder
                    ]}
                    onPress={() => onSelectType(groupLine.id, 'under')}
                  >
                    <Text style={styles.optionLabel}>UNDER</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.sliderSection}>
                  <Text style={styles.sliderLabel}>Set Your Line</Text>
                  <View style={styles.sliderContainer}>
                    <Slider
                      style={styles.slider}
                      minimumValue={groupLine.min}
                      maximumValue={groupLine.max}
                      value={customLines[groupLine.id] || Math.round((groupLine.min + groupLine.max) / 2)}
                      onValueChange={(value) => onSetCustomLine(groupLine.id, Math.round(value))}
                      step={1}
                      minimumTrackTintColor="#00F5FF"
                      maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
                      thumbStyle={styles.sliderThumb}
                    />
                    <View style={styles.numberInputContainer}>
                      <TextInput
                        style={styles.numberInput}
                        value={String(customLines[groupLine.id] || Math.round((groupLine.min + groupLine.max) / 2))}
                        onChangeText={(text) => {
                          const value = parseInt(text) || groupLine.min;
                          if (value >= groupLine.min && value <= groupLine.max) {
                            onSetCustomLine(groupLine.id, value);
                          }
                        }}
                        keyboardType="numeric"
                        maxLength={3}
                        returnKeyType="done"
                      />
                    </View>
                  </View>
                </View>
                
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={() => onConfirmBet(groupLine.id)}
                >
                  <Text style={styles.confirmButtonText}>Confirm Bet</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      })}
      
      {groupLines.filter(line => line.active).length === 0 && (
        <View style={styles.noBetsContainer}>
          <Text style={styles.noBetsIcon}>🎲</Text>
          <Text style={styles.noBetsTitle}>No Active Bets</Text>
          <Text style={styles.noBetsText}>
            Bets will appear here when the game is live
          </Text>
        </View>
      )}
      
      {groupLines.filter(line => !line.active).length > 0 && (
        <>
          <Text style={styles.closedBetsTitle}>Closed Bets</Text>
          {groupLines.filter(line => !line.active).map((groupLine) => {
            const playerResponse = playerResponses[groupLine.id];
            const hasAnswered = !!playerResponse;
            
            return (
              <View key={groupLine.id} style={[styles.betCard, styles.closedBetCard]}>
                <View style={styles.betCardHeader}>
                  <Text style={styles.questionText}>{groupLine.question}</Text>
                  <Text style={styles.rangeText}>Range: {groupLine.min} - {groupLine.max}</Text>
                  {groupLine.actual !== undefined && (
                    <Text style={styles.actualText}>Actual: {groupLine.actual}</Text>
                  )}
                </View>
                
                {hasAnswered && (
                  <View style={styles.answeredContainer}>
                    <View style={styles.answeredBadge}>
                      <Text style={styles.checkmark}>✓</Text>
                    </View>
                    <Text style={styles.answeredText}>
                      Your bet: {playerResponse.type.toUpperCase()} {playerResponse.line}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </>
      )}

      {/* Create Bet Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={createBetModal}
        onRequestClose={() => setCreateBetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Group Bet</Text>
              <TouchableOpacity onPress={() => setCreateBetModal(false)}>
                <Text style={styles.closeButton}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.inputLabel}>Question</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter your question..."
                placeholderTextColor="#6B7280"
                value={newBetQuestion}
                onChangeText={setNewBetQuestion}
                multiline
              />
              
              <View style={styles.rangeContainer}>
                <View style={styles.rangeInputContainer}>
                  <Text style={styles.inputLabel}>Min</Text>
                  <TextInput
                    style={styles.rangeInput}
                    placeholder="0"
                    placeholderTextColor="#6B7280"
                    value={newBetMin}
                    onChangeText={setNewBetMin}
                    keyboardType="numeric"
                    returnKeyType="done"
                    blurOnSubmit={true}
                  />
                </View>
                
                <Text style={styles.rangeSeparator}>to</Text>
                
                <View style={styles.rangeInputContainer}>
                  <Text style={styles.inputLabel}>Max</Text>
                  <TextInput
                    style={styles.rangeInput}
                    placeholder="100"
                    placeholderTextColor="#6B7280"
                    value={newBetMax}
                    onChangeText={setNewBetMax}
                    keyboardType="numeric"
                    returnKeyType="done"
                    blurOnSubmit={true}
                  />
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.createButton}
                onPress={handleCreateBet}
              >
                <Text style={styles.createButtonText}>Create Bet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Answer Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={answerModal}
        onRequestClose={() => setAnswerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Answer</Text>
              <TouchableOpacity onPress={() => setAnswerModal(false)}>
                <Text style={styles.closeButton}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.inputLabel}>Actual Result</Text>
              <TextInput
                style={styles.rangeInput}
                placeholder="Enter the actual result"
                placeholderTextColor="#6B7280"
                value={answerValue}
                onChangeText={setAnswerValue}
                keyboardType="numeric"
                returnKeyType="done"
              />
              
              <TouchableOpacity 
                style={styles.createButton}
                onPress={handleSetAnswer}
              >
                <Text style={styles.createButtonText}>Set Answer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  betsSection: {
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  liveScoreContainer: {
    backgroundColor: 'rgba(16, 23, 42, 0.8)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  liveScoreTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#22C55E',
    textAlign: 'center',
    marginBottom: 12,
  },
  scoreDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreTeam: {
    alignItems: 'center',
    flex: 1,
  },
  scoreTeamName: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scoreSeparator: {
    fontSize: 24,
    color: '#6B7280',
    marginHorizontal: 20,
  },
  betsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  createBetButton: {
    backgroundColor: '#00F5FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createBetButtonText: {
    color: '#0A0E27',
    fontSize: 12,
    fontWeight: 'bold',
  },
  betCard: {
    backgroundColor: 'rgba(16, 23, 42, 0.8)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.2)',
  },
  betCardHeader: {
    marginBottom: 20,
  },
  questionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  rangeText: {
    fontSize: 14,
    color: '#6B7280',
  },
  setAnswerButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
  },
  setAnswerButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  actualText: {
    fontSize: 14,
    color: '#22C55E',
    fontWeight: 'bold',
    marginTop: 4,
  },
  answeredContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  answeredBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkmark: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  answeredText: {
    fontSize: 16,
    color: '#22C55E',
    fontWeight: '600',
  },
  bettingInterface: {
    gap: 20,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  overButton: {
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  underButton: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  selectedOver: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: '#22C55E',
  },
  selectedUnder: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#EF4444',
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sliderSection: {
    gap: 12,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderThumb: {
    backgroundColor: '#00F5FF',
    width: 24,
    height: 24,
    shadowColor: '#00F5FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  numberInputContainer: {
    backgroundColor: 'rgba(0, 245, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00F5FF',
  },
  numberInput: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: 'bold',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 70,
  },
  confirmButton: {
    backgroundColor: '#00F5FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#00F5FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  confirmButtonText: {
    color: '#0A0E27',
    fontSize: 18,
    fontWeight: 'bold',
  },
  noBetsContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  noBetsIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  noBetsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  noBetsText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  closedBetsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B7280',
    marginTop: 32,
    marginBottom: 16,
    textAlign: 'center',
  },
  closedBetCard: {
    opacity: 0.7,
    borderColor: 'rgba(107, 114, 128, 0.3)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'rgba(16, 23, 42, 0.95)',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.3)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    fontSize: 28,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  modalContent: {
    gap: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.3)',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  rangeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
  },
  rangeInputContainer: {
    flex: 1,
  },
  rangeInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.3)',
  },
  rangeSeparator: {
    color: '#6B7280',
    fontSize: 16,
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: '#00F5FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  createButtonText: {
    color: '#0A0E27',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LiveBetsTab;