import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Member {
  id: string;
  name: string;
  score: number;
  isOwner: boolean;
}

interface TeamData {
  name: string;
  joinCode: string;
  createdBy: string;
  members: string[];
}

interface LeaderboardTabProps {
  teamData: TeamData | null;
  members: Member[];
}

const LeaderboardTab: React.FC<LeaderboardTabProps> = ({ teamData, members }) => {
  return (
    <View style={styles.membersSection}>
      {teamData && (
        <View style={styles.teamInfoContainer}>
          <Text style={styles.teamInfoTitle}>Team Info</Text>
          <View style={styles.joinCodeDisplay}>
            <Text style={styles.joinCodeLabel}>Join Code</Text>
            <View style={styles.joinCodeBadge}>
              <Text style={styles.joinCodeValue}>{teamData.joinCode}</Text>
            </View>
          </View>
        </View>
      )}
      
      <View style={styles.leaderboardSection}>
        <Text style={styles.leaderboardTitle}>Live Rankings</Text>
        <View style={styles.leaderboardContainer}>
          {members.map((member, index) => (
            <View 
              key={member.id} 
              style={[
                styles.memberCard,
                index === 0 && styles.firstPlace
              ]}
            >
              <View style={[
                styles.memberRank,
                index === 0 && styles.firstPlaceRank,
                index === 1 && styles.secondPlaceRank,
                index === 2 && styles.thirdPlaceRank,
              ]}>
                <Text style={[
                  styles.rankText,
                  index === 0 && styles.firstPlaceRankText
                ]}>
                  {index === 0 ? '👑' : `#${index + 1}`}
                </Text>
              </View>
              
              <View style={styles.memberInfo}>
                <View style={styles.memberNameContainer}>
                  <Text style={[
                    styles.memberName,
                    index === 0 && styles.firstPlaceName
                  ]}>
                    {member.name}
                  </Text>
                  {member.isOwner && (
                    <Text style={styles.ownerBadge}>⭐</Text>
                  )}
                </View>
                <Text style={[
                  styles.memberScore,
                  index === 0 && styles.firstPlaceScore
                ]}>
                  {member.score} pts
                </Text>
              </View>
            </View>
          ))}
          
          {members.length === 0 && (
            <View style={styles.noMembersContainer}>
              <Text style={styles.noMembersIcon}>👥</Text>
              <Text style={styles.noMembersText}>
                No members yet. Share the join code!
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  membersSection: {
    paddingBottom: 40,
  },
  teamInfoContainer: {
    backgroundColor: 'rgba(16, 23, 42, 0.8)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.2)',
  },
  teamInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  joinCodeDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  joinCodeLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  joinCodeBadge: {
    backgroundColor: 'rgba(0, 245, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00F5FF',
  },
  joinCodeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00F5FF',
  },
  leaderboardSection: {
    gap: 16,
  },
  leaderboardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  leaderboardContainer: {
    gap: 12,
  },
  memberCard: {
    backgroundColor: 'rgba(16, 23, 42, 0.8)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  firstPlace: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  memberRank: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 245, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  firstPlaceRank: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  secondPlaceRank: {
    backgroundColor: 'rgba(192, 192, 192, 0.2)',
  },
  thirdPlaceRank: {
    backgroundColor: 'rgba(205, 127, 50, 0.2)',
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00F5FF',
  },
  firstPlaceRankText: {
    fontSize: 20,
  },
  memberInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberName: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  firstPlaceName: {
    color: '#FFD700',
  },
  ownerBadge: {
    fontSize: 16,
    marginLeft: 8,
  },
  memberScore: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  firstPlaceScore: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  noMembersContainer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  noMembersIcon: {
    fontSize: 50,
    marginBottom: 12,
  },
  noMembersText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default LeaderboardTab;