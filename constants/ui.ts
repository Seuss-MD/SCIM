// components/ui.ts
import { StyleSheet } from 'react-native';

export const ui = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F3E3',
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 32,
    gap: 16,
  },

  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#2B2118',
    letterSpacing: -0.5,
  },

  subtitle: {
    fontSize: 15,
    color: '#6B625A',
    lineHeight: 22,
  },

  card: {
    backgroundColor: '#FFFDF8',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D6D0C7',
    shadowColor: '#2B2118',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  input: {
    backgroundColor: '#FFFDF8',
    borderWidth: 1,
    borderColor: '#D6D0C7',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2B2118',
  },

  primaryButton: {
    backgroundColor: '#AF9164',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryButtonText: {
    color: '#FFFDF8',
    fontSize: 16,
    fontWeight: '700',
  },

  secondaryButton: {
    backgroundColor: '#EFE7D4',
    borderWidth: 1,
    borderColor: '#D6D0C7',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryButtonText: {
    color: '#2B2118',
    fontSize: 16,
    fontWeight: '700',
  },

  dangerButton: {
    backgroundColor: '#6F1A07',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  dangerButtonText: {
    color: '#FFF8F6',
    fontSize: 16,
    fontWeight: '700',
  },

  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B625A',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});