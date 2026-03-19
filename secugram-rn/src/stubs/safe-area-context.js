import React from 'react';
import { View } from 'react-native';

export const SafeAreaProvider = ({ children }) => React.createElement(View, { style: { flex: 1 } }, children);
export const SafeAreaView = ({ children, style }) => React.createElement(View, { style: [{ flex: 1 }, style] }, children);
export const useSafeAreaInsets = () => ({ top: 0, bottom: 0, left: 0, right: 0 });
export const useSafeAreaFrame = () => ({ x: 0, y: 0, width: window.innerWidth, height: window.innerHeight });
export const initialWindowMetrics = null;
