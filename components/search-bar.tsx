import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TextInputProps,
} from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

type SearchBarProps = TextInputProps & {
  placeholder?: string;
};

export default function SearchBar({
  placeholder = 'Search...',
  style,
  ...rest
}: SearchBarProps) {
  const [value, setValue] = useState('');

  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'text');

  return (
    <View style={[styles.container, { borderColor }]}>
      <TextInput
        value={value}
        onChangeText={setValue}
        placeholder={placeholder}
        placeholderTextColor="#888"
        style={[styles.input, { color: borderColor }, style]}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 45,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 16,
    backgroundColor: 'white',
  },
  input: {
    fontSize: 16,
  },
});
