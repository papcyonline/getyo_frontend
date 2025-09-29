import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Localization from 'expo-localization';
import { RootStackParamList, UserDetailsData } from '../types';
import { RouteProp } from '@react-navigation/native';
import ApiService from '../services/api';

const { height, width } = Dimensions.get('window');

type PhoneInputNavigationProp = StackNavigationProp<RootStackParamList, 'PhoneInput'>;
type PhoneInputRouteProp = RouteProp<RootStackParamList, 'PhoneInput'>;

interface Country {
  code: string;
  name: string;
  flag: string;
  minLength: number;
  maxLength: number;
  format?: string; // Optional formatting pattern
}

const countries: Country[] = [
  // North America
  { code: '+1', name: 'United States', flag: '🇺🇸', minLength: 10, maxLength: 10 },
  { code: '+1', name: 'Canada', flag: '🇨🇦', minLength: 10, maxLength: 10 },
  { code: '+52', name: 'Mexico', flag: '🇲🇽', minLength: 10, maxLength: 10 },

  // Europe
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧', minLength: 10, maxLength: 11 },
  { code: '+49', name: 'Germany', flag: '🇩🇪', minLength: 10, maxLength: 12 },
  { code: '+33', name: 'France', flag: '🇫🇷', minLength: 9, maxLength: 9 },
  { code: '+39', name: 'Italy', flag: '🇮🇹', minLength: 9, maxLength: 11 },
  { code: '+34', name: 'Spain', flag: '🇪🇸', minLength: 9, maxLength: 9 },
  { code: '+31', name: 'Netherlands', flag: '🇳🇱', minLength: 9, maxLength: 9 },
  { code: '+41', name: 'Switzerland', flag: '🇨🇭', minLength: 9, maxLength: 9 },
  { code: '+46', name: 'Sweden', flag: '🇸🇪', minLength: 8, maxLength: 9 },
  { code: '+47', name: 'Norway', flag: '🇳🇴', minLength: 8, maxLength: 8 },
  { code: '+45', name: 'Denmark', flag: '🇩🇰', minLength: 8, maxLength: 8 },
  { code: '+358', name: 'Finland', flag: '🇫🇮', minLength: 9, maxLength: 10 },
  { code: '+43', name: 'Austria', flag: '🇦🇹', minLength: 10, maxLength: 13 },
  { code: '+32', name: 'Belgium', flag: '🇧🇪', minLength: 8, maxLength: 9 },
  { code: '+351', name: 'Portugal', flag: '🇵🇹', minLength: 9, maxLength: 9 },
  { code: '+7', name: 'Russia', flag: '🇷🇺', minLength: 10, maxLength: 10 },
  { code: '+48', name: 'Poland', flag: '🇵🇱', minLength: 9, maxLength: 9 },
  { code: '+420', name: 'Czech Republic', flag: '🇨🇿', minLength: 9, maxLength: 9 },
  { code: '+421', name: 'Slovakia', flag: '🇸🇰', minLength: 9, maxLength: 9 },
  { code: '+36', name: 'Hungary', flag: '🇭🇺', minLength: 8, maxLength: 9 },
  { code: '+40', name: 'Romania', flag: '🇷🇴', minLength: 9, maxLength: 9 },
  { code: '+359', name: 'Bulgaria', flag: '🇧🇬', minLength: 8, maxLength: 9 },
  { code: '+385', name: 'Croatia', flag: '🇭🇷', minLength: 8, maxLength: 9 },
  { code: '+386', name: 'Slovenia', flag: '🇸🇮', minLength: 8, maxLength: 8 },
  { code: '+381', name: 'Serbia', flag: '🇷🇸', minLength: 8, maxLength: 9 },
  { code: '+382', name: 'Montenegro', flag: '🇲🇪', minLength: 8, maxLength: 8 },
  { code: '+387', name: 'Bosnia and Herzegovina', flag: '🇧🇦', minLength: 8, maxLength: 8 },
  { code: '+389', name: 'North Macedonia', flag: '🇲🇰', minLength: 8, maxLength: 8 },
  { code: '+30', name: 'Greece', flag: '🇬🇷', minLength: 10, maxLength: 10 },
  { code: '+90', name: 'Turkey', flag: '🇹🇷', minLength: 10, maxLength: 10 },
  { code: '+374', name: 'Armenia', flag: '🇦🇲', minLength: 8, maxLength: 8 },
  { code: '+994', name: 'Azerbaijan', flag: '🇦🇿', minLength: 9, maxLength: 9 },
  { code: '+995', name: 'Georgia', flag: '🇬🇪', minLength: 9, maxLength: 9 },
  { code: '+375', name: 'Belarus', flag: '🇧🇾', minLength: 9, maxLength: 9 },
  { code: '+380', name: 'Ukraine', flag: '🇺🇦', minLength: 9, maxLength: 9 },
  { code: '+373', name: 'Moldova', flag: '🇲🇩', minLength: 8, maxLength: 8 },
  { code: '+370', name: 'Lithuania', flag: '🇱🇹', minLength: 8, maxLength: 8 },
  { code: '+371', name: 'Latvia', flag: '🇱🇻', minLength: 8, maxLength: 8 },
  { code: '+372', name: 'Estonia', flag: '🇪🇪', minLength: 7, maxLength: 8 },
  { code: '+354', name: 'Iceland', flag: '🇮🇸', minLength: 7, maxLength: 7 },
  { code: '+353', name: 'Ireland', flag: '🇮🇪', minLength: 9, maxLength: 9 },
  { code: '+377', name: 'Monaco', flag: '🇲🇨', minLength: 8, maxLength: 9 },
  { code: '+378', name: 'San Marino', flag: '🇸🇲', minLength: 6, maxLength: 10 },
  { code: '+379', name: 'Vatican City', flag: '🇻🇦', minLength: 6, maxLength: 10 },
  { code: '+376', name: 'Andorra', flag: '🇦🇩', minLength: 6, maxLength: 6 },
  { code: '+350', name: 'Gibraltar', flag: '🇬🇮', minLength: 8, maxLength: 8 },
  { code: '+298', name: 'Faroe Islands', flag: '🇫🇴', minLength: 6, maxLength: 6 },
  { code: '+356', name: 'Malta', flag: '🇲🇹', minLength: 8, maxLength: 8 },
  { code: '+357', name: 'Cyprus', flag: '🇨🇾', minLength: 8, maxLength: 8 },

  // Asia
  { code: '+86', name: 'China', flag: '🇨🇳', minLength: 11, maxLength: 11 },
  { code: '+91', name: 'India', flag: '🇮🇳', minLength: 10, maxLength: 10 },
  { code: '+81', name: 'Japan', flag: '🇯🇵', minLength: 10, maxLength: 11 },
  { code: '+82', name: 'South Korea', flag: '🇰🇷', minLength: 9, maxLength: 10 },
  { code: '+65', name: 'Singapore', flag: '🇸🇬', minLength: 8, maxLength: 8 },
  { code: '+852', name: 'Hong Kong', flag: '🇭🇰', minLength: 8, maxLength: 8 },
  { code: '+853', name: 'Macau', flag: '🇲🇴', minLength: 8, maxLength: 8 },
  { code: '+886', name: 'Taiwan', flag: '🇹🇼', minLength: 9, maxLength: 9 },
  { code: '+62', name: 'Indonesia', flag: '🇮🇩', minLength: 9, maxLength: 13 },
  { code: '+60', name: 'Malaysia', flag: '🇲🇾', minLength: 9, maxLength: 10 },
  { code: '+66', name: 'Thailand', flag: '🇹🇭', minLength: 9, maxLength: 9 },
  { code: '+84', name: 'Vietnam', flag: '🇻🇳', minLength: 9, maxLength: 10 },
  { code: '+63', name: 'Philippines', flag: '🇵🇭', minLength: 10, maxLength: 10 },
  { code: '+95', name: 'Myanmar', flag: '🇲🇲', minLength: 8, maxLength: 10 },
  { code: '+856', name: 'Laos', flag: '🇱🇦', minLength: 8, maxLength: 10 },
  { code: '+855', name: 'Cambodia', flag: '🇰🇭', minLength: 8, maxLength: 9 },
  { code: '+673', name: 'Brunei', flag: '🇧🇳', minLength: 7, maxLength: 7 },
  { code: '+670', name: 'East Timor', flag: '🇹🇱', minLength: 7, maxLength: 8 },
  { code: '+880', name: 'Bangladesh', flag: '🇧🇩', minLength: 10, maxLength: 10 },
  { code: '+94', name: 'Sri Lanka', flag: '🇱🇰', minLength: 9, maxLength: 9 },
  { code: '+960', name: 'Maldives', flag: '🇲🇻', minLength: 7, maxLength: 7 },
  { code: '+977', name: 'Nepal', flag: '🇳🇵', minLength: 10, maxLength: 10 },
  { code: '+975', name: 'Bhutan', flag: '🇧🇹', minLength: 8, maxLength: 8 },
  { code: '+92', name: 'Pakistan', flag: '🇵🇰', minLength: 10, maxLength: 10 },
  { code: '+93', name: 'Afghanistan', flag: '🇦🇫', minLength: 9, maxLength: 9 },
  { code: '+98', name: 'Iran', flag: '🇮🇷', minLength: 10, maxLength: 10 },
  { code: '+964', name: 'Iraq', flag: '🇮🇶', minLength: 10, maxLength: 10 },
  { code: '+963', name: 'Syria', flag: '🇸🇾', minLength: 9, maxLength: 9 },
  { code: '+961', name: 'Lebanon', flag: '🇱🇧', minLength: 7, maxLength: 8 },
  { code: '+962', name: 'Jordan', flag: '🇯🇴', minLength: 9, maxLength: 9 },
  { code: '+972', name: 'Israel', flag: '🇮🇱', minLength: 9, maxLength: 9 },
  { code: '+970', name: 'Palestine', flag: '🇵🇸', minLength: 9, maxLength: 9 },
  { code: '+996', name: 'Kyrgyzstan', flag: '🇰🇬', minLength: 9, maxLength: 9 },
  { code: '+992', name: 'Tajikistan', flag: '🇹🇯', minLength: 9, maxLength: 9 },
  { code: '+998', name: 'Uzbekistan', flag: '🇺🇿', minLength: 9, maxLength: 9 },
  { code: '+993', name: 'Turkmenistan', flag: '🇹🇲', minLength: 8, maxLength: 8 },
  { code: '+7', name: 'Kazakhstan', flag: '🇰🇿', minLength: 10, maxLength: 10 },
  { code: '+976', name: 'Mongolia', flag: '🇲🇳', minLength: 8, maxLength: 8 },

  // Middle East
  { code: '+971', name: 'UAE', flag: '🇦🇪', minLength: 9, maxLength: 9 },
  { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦', minLength: 9, maxLength: 9 },
  { code: '+974', name: 'Qatar', flag: '🇶🇦', minLength: 8, maxLength: 8 },
  { code: '+965', name: 'Kuwait', flag: '🇰🇼', minLength: 8, maxLength: 8 },
  { code: '+973', name: 'Bahrain', flag: '🇧🇭', minLength: 8, maxLength: 8 },
  { code: '+968', name: 'Oman', flag: '🇴🇲', minLength: 8, maxLength: 8 },
  { code: '+967', name: 'Yemen', flag: '🇾🇪', minLength: 9, maxLength: 9 },

  // Africa
  { code: '+20', name: 'Egypt', flag: '🇪🇬', minLength: 10, maxLength: 10 },
  { code: '+234', name: 'Nigeria', flag: '🇳🇬', minLength: 10, maxLength: 10 },
  { code: '+27', name: 'South Africa', flag: '🇿🇦', minLength: 9, maxLength: 9 },
  { code: '+254', name: 'Kenya', flag: '🇰🇪', minLength: 9, maxLength: 9 },
  { code: '+256', name: 'Uganda', flag: '🇺🇬', minLength: 9, maxLength: 9 },
  { code: '+255', name: 'Tanzania', flag: '🇹🇿', minLength: 9, maxLength: 9 },
  { code: '+250', name: 'Rwanda', flag: '🇷🇼', minLength: 9, maxLength: 9 },
  { code: '+257', name: 'Burundi', flag: '🇧🇮', minLength: 8, maxLength: 8 },
  { code: '+251', name: 'Ethiopia', flag: '🇪🇹', minLength: 9, maxLength: 9 },
  { code: '+252', name: 'Somalia', flag: '🇸🇴', minLength: 8, maxLength: 9 },
  { code: '+253', name: 'Djibouti', flag: '🇩🇯', minLength: 8, maxLength: 8 },
  { code: '+249', name: 'Sudan', flag: '🇸🇩', minLength: 9, maxLength: 9 },
  { code: '+211', name: 'South Sudan', flag: '🇸🇸', minLength: 9, maxLength: 9 },
  { code: '+235', name: 'Chad', flag: '🇹🇩', minLength: 8, maxLength: 8 },
  { code: '+236', name: 'Central African Republic', flag: '🇨🇫', minLength: 8, maxLength: 8 },
  { code: '+237', name: 'Cameroon', flag: '🇨🇲', minLength: 9, maxLength: 9 },
  { code: '+240', name: 'Equatorial Guinea', flag: '🇬🇶', minLength: 9, maxLength: 9 },
  { code: '+241', name: 'Gabon', flag: '🇬🇦', minLength: 8, maxLength: 8 },
  { code: '+242', name: 'Republic of the Congo', flag: '🇨🇬', minLength: 9, maxLength: 9 },
  { code: '+243', name: 'Democratic Republic of the Congo', flag: '🇨🇩', minLength: 9, maxLength: 9 },
  { code: '+244', name: 'Angola', flag: '🇦🇴', minLength: 9, maxLength: 9 },
  { code: '+260', name: 'Zambia', flag: '🇿🇲', minLength: 9, maxLength: 9 },
  { code: '+263', name: 'Zimbabwe', flag: '🇿🇼', minLength: 9, maxLength: 9 },
  { code: '+264', name: 'Namibia', flag: '🇳🇦', minLength: 8, maxLength: 9 },
  { code: '+267', name: 'Botswana', flag: '🇧🇼', minLength: 8, maxLength: 8 },
  { code: '+268', name: 'Eswatini', flag: '🇸🇿', minLength: 8, maxLength: 8 },
  { code: '+266', name: 'Lesotho', flag: '🇱🇸', minLength: 8, maxLength: 8 },
  { code: '+261', name: 'Madagascar', flag: '🇲🇬', minLength: 9, maxLength: 9 },
  { code: '+230', name: 'Mauritius', flag: '🇲🇺', minLength: 8, maxLength: 8 },
  { code: '+248', name: 'Seychelles', flag: '🇸🇨', minLength: 7, maxLength: 7 },
  { code: '+269', name: 'Comoros', flag: '🇰🇲', minLength: 7, maxLength: 7 },
  { code: '+212', name: 'Morocco', flag: '🇲🇦', minLength: 9, maxLength: 9 },
  { code: '+213', name: 'Algeria', flag: '🇩🇿', minLength: 9, maxLength: 9 },
  { code: '+216', name: 'Tunisia', flag: '🇹🇳', minLength: 8, maxLength: 8 },
  { code: '+218', name: 'Libya', flag: '🇱🇾', minLength: 9, maxLength: 9 },
  { code: '+220', name: 'Gambia', flag: '🇬🇲', minLength: 7, maxLength: 7 },
  { code: '+221', name: 'Senegal', flag: '🇸🇳', minLength: 9, maxLength: 9 },
  { code: '+222', name: 'Mauritania', flag: '🇲🇷', minLength: 8, maxLength: 8 },
  { code: '+223', name: 'Mali', flag: '🇲🇱', minLength: 8, maxLength: 8 },
  { code: '+224', name: 'Guinea', flag: '🇬🇳', minLength: 9, maxLength: 9 },
  { code: '+225', name: 'Ivory Coast', flag: '🇨🇮', minLength: 8, maxLength: 10 },
  { code: '+226', name: 'Burkina Faso', flag: '🇧🇫', minLength: 8, maxLength: 8 },
  { code: '+227', name: 'Niger', flag: '🇳🇪', minLength: 8, maxLength: 8 },
  { code: '+228', name: 'Togo', flag: '🇹🇬', minLength: 8, maxLength: 8 },
  { code: '+229', name: 'Benin', flag: '🇧🇯', minLength: 8, maxLength: 8 },
  { code: '+233', name: 'Ghana', flag: '🇬🇭', minLength: 9, maxLength: 9 },
  { code: '+231', name: 'Liberia', flag: '🇱🇷', minLength: 8, maxLength: 9 },
  { code: '+232', name: 'Sierra Leone', flag: '🇸🇱', minLength: 8, maxLength: 8 },
  { code: '+238', name: 'Cape Verde', flag: '🇨🇻', minLength: 7, maxLength: 7 },
  { code: '+239', name: 'São Tomé and Príncipe', flag: '🇸🇹', minLength: 7, maxLength: 7 },

  // South America
  { code: '+55', name: 'Brazil', flag: '🇧🇷', minLength: 10, maxLength: 11 },
  { code: '+54', name: 'Argentina', flag: '🇦🇷', minLength: 10, maxLength: 11 },
  { code: '+56', name: 'Chile', flag: '🇨🇱', minLength: 9, maxLength: 9 },
  { code: '+57', name: 'Colombia', flag: '🇨🇴', minLength: 10, maxLength: 10 },
  { code: '+51', name: 'Peru', flag: '🇵🇪', minLength: 9, maxLength: 9 },
  { code: '+58', name: 'Venezuela', flag: '🇻🇪', minLength: 10, maxLength: 10 },
  { code: '+593', name: 'Ecuador', flag: '🇪🇨', minLength: 9, maxLength: 9 },
  { code: '+591', name: 'Bolivia', flag: '🇧🇴', minLength: 8, maxLength: 8 },
  { code: '+595', name: 'Paraguay', flag: '🇵🇾', minLength: 9, maxLength: 9 },
  { code: '+598', name: 'Uruguay', flag: '🇺🇾', minLength: 8, maxLength: 8 },
  { code: '+597', name: 'Suriname', flag: '🇸🇷', minLength: 7, maxLength: 7 },
  { code: '+592', name: 'Guyana', flag: '🇬🇾', minLength: 7, maxLength: 7 },
  { code: '+594', name: 'French Guiana', flag: '🇬🇫', minLength: 9, maxLength: 9 },

  // Oceania
  { code: '+61', name: 'Australia', flag: '🇦🇺', minLength: 9, maxLength: 9 },
  { code: '+64', name: 'New Zealand', flag: '🇳🇿', minLength: 8, maxLength: 10 },
  { code: '+679', name: 'Fiji', flag: '🇫🇯', minLength: 7, maxLength: 7 },
  { code: '+685', name: 'Samoa', flag: '🇼🇸', minLength: 5, maxLength: 7 },
  { code: '+676', name: 'Tonga', flag: '🇹🇴', minLength: 5, maxLength: 7 },
  { code: '+678', name: 'Vanuatu', flag: '🇻🇺', minLength: 5, maxLength: 7 },
  { code: '+687', name: 'New Caledonia', flag: '🇳🇨', minLength: 6, maxLength: 6 },
  { code: '+689', name: 'French Polynesia', flag: '🇵🇫', minLength: 6, maxLength: 8 },
  { code: '+682', name: 'Cook Islands', flag: '🇨🇰', minLength: 5, maxLength: 5 },
  { code: '+690', name: 'Tokelau', flag: '🇹🇰', minLength: 4, maxLength: 4 },
  { code: '+691', name: 'Micronesia', flag: '🇫🇲', minLength: 7, maxLength: 7 },
  { code: '+692', name: 'Marshall Islands', flag: '🇲🇭', minLength: 7, maxLength: 7 },
  { code: '+680', name: 'Palau', flag: '🇵🇼', minLength: 7, maxLength: 7 },
  { code: '+674', name: 'Nauru', flag: '🇳🇷', minLength: 7, maxLength: 7 },
  { code: '+683', name: 'Niue', flag: '🇳🇺', minLength: 4, maxLength: 4 },
  { code: '+684', name: 'American Samoa', flag: '🇦🇸', minLength: 10, maxLength: 10 },
  { code: '+681', name: 'Wallis and Futuna', flag: '🇼🇫', minLength: 6, maxLength: 6 },
  { code: '+675', name: 'Papua New Guinea', flag: '🇵🇬', minLength: 8, maxLength: 8 },
  { code: '+677', name: 'Solomon Islands', flag: '🇸🇧', minLength: 5, maxLength: 7 },
  { code: '+686', name: 'Kiribati', flag: '🇰🇮', minLength: 5, maxLength: 8 },
  { code: '+688', name: 'Tuvalu', flag: '🇹🇻', minLength: 5, maxLength: 5 },

  // Central America & Caribbean
  { code: '+503', name: 'El Salvador', flag: '🇸🇻', minLength: 8, maxLength: 8 },
  { code: '+502', name: 'Guatemala', flag: '🇬🇹', minLength: 8, maxLength: 8 },
  { code: '+504', name: 'Honduras', flag: '🇭🇳', minLength: 8, maxLength: 8 },
  { code: '+505', name: 'Nicaragua', flag: '🇳🇮', minLength: 8, maxLength: 8 },
  { code: '+506', name: 'Costa Rica', flag: '🇨🇷', minLength: 8, maxLength: 8 },
  { code: '+507', name: 'Panama', flag: '🇵🇦', minLength: 8, maxLength: 8 },
  { code: '+501', name: 'Belize', flag: '🇧🇿', minLength: 7, maxLength: 7 },
  { code: '+1', name: 'Jamaica', flag: '🇯🇲', minLength: 10, maxLength: 10 },
  { code: '+1', name: 'Cuba', flag: '🇨🇺', minLength: 8, maxLength: 8 },
  { code: '+1', name: 'Haiti', flag: '🇭🇹', minLength: 8, maxLength: 8 },
  { code: '+1', name: 'Dominican Republic', flag: '🇩🇴', minLength: 10, maxLength: 10 },
  { code: '+1', name: 'Puerto Rico', flag: '🇵🇷', minLength: 10, maxLength: 10 },
  { code: '+1', name: 'Trinidad and Tobago', flag: '🇹🇹', minLength: 10, maxLength: 10 },
  { code: '+1', name: 'Barbados', flag: '🇧🇧', minLength: 10, maxLength: 10 },
  { code: '+1', name: 'Bahamas', flag: '🇧🇸', minLength: 10, maxLength: 10 },
  { code: '+1', name: 'Antigua and Barbuda', flag: '🇦🇬', minLength: 10, maxLength: 10 },
  { code: '+1', name: 'Saint Lucia', flag: '🇱🇨', minLength: 10, maxLength: 10 },
  { code: '+1', name: 'Grenada', flag: '🇬🇩', minLength: 10, maxLength: 10 },
  { code: '+1', name: 'Saint Vincent and the Grenadines', flag: '🇻🇨', minLength: 10, maxLength: 10 },
  { code: '+1', name: 'Saint Kitts and Nevis', flag: '🇰🇳', minLength: 10, maxLength: 10 },
  { code: '+1', name: 'Dominica', flag: '🇩🇲', minLength: 10, maxLength: 10 },
];

const PhoneInputScreen: React.FC = () => {
  const navigation = useNavigation<PhoneInputNavigationProp>();
  const route = useRoute<PhoneInputRouteProp>();
  const insets = useSafeAreaInsets();
  const userDetails = route.params?.userDetails;

  // Function to get default country based on device locale
  const getDefaultCountry = (): Country => {
    try {
      // Get device locale (e.g., 'en-US', 'fr-FR', 'de-DE')
      const deviceLocale = Localization.locale;

      if (!deviceLocale) {
        return countries[0]; // Default to first country (United States)
      }

      // Extract country code from locale (e.g., 'US' from 'en-US')
      const countryCode = deviceLocale.split('-')[1]?.toUpperCase();

      if (!countryCode) {
        return countries[0];
      }

      // Map country codes to countries in our list
      const countryMap: { [key: string]: string } = {
        'US': 'United States',
        'CA': 'Canada',
        'MX': 'Mexico',
        'GB': 'United Kingdom',
        'DE': 'Germany',
        'FR': 'France',
        'IT': 'Italy',
        'ES': 'Spain',
        'NL': 'Netherlands',
        'CH': 'Switzerland',
        'SE': 'Sweden',
        'NO': 'Norway',
        'DK': 'Denmark',
        'FI': 'Finland',
        'AT': 'Austria',
        'BE': 'Belgium',
        'PT': 'Portugal',
        'RU': 'Russia',
        'PL': 'Poland',
        'CZ': 'Czech Republic',
        'SK': 'Slovakia',
        'HU': 'Hungary',
        'RO': 'Romania',
        'BG': 'Bulgaria',
        'HR': 'Croatia',
        'SI': 'Slovenia',
        'RS': 'Serbia',
        'ME': 'Montenegro',
        'BA': 'Bosnia and Herzegovina',
        'MK': 'North Macedonia',
        'GR': 'Greece',
        'TR': 'Turkey',
        'AM': 'Armenia',
        'AZ': 'Azerbaijan',
        'GE': 'Georgia',
        'BY': 'Belarus',
        'UA': 'Ukraine',
        'MD': 'Moldova',
        'LT': 'Lithuania',
        'LV': 'Latvia',
        'EE': 'Estonia',
        'IS': 'Iceland',
        'IE': 'Ireland',
        'MC': 'Monaco',
        'SM': 'San Marino',
        'VA': 'Vatican City',
        'AD': 'Andorra',
        'GI': 'Gibraltar',
        'FO': 'Faroe Islands',
        'MT': 'Malta',
        'CY': 'Cyprus',
        'CN': 'China',
        'IN': 'India',
        'JP': 'Japan',
        'KR': 'South Korea',
        'SG': 'Singapore',
        'HK': 'Hong Kong',
        'MO': 'Macau',
        'TW': 'Taiwan',
        'ID': 'Indonesia',
        'MY': 'Malaysia',
        'TH': 'Thailand',
        'VN': 'Vietnam',
        'PH': 'Philippines',
        'MM': 'Myanmar',
        'LA': 'Laos',
        'KH': 'Cambodia',
        'BN': 'Brunei',
        'TL': 'East Timor',
        'BD': 'Bangladesh',
        'LK': 'Sri Lanka',
        'MV': 'Maldives',
        'NP': 'Nepal',
        'BT': 'Bhutan',
        'PK': 'Pakistan',
        'AF': 'Afghanistan',
        'IR': 'Iran',
        'IQ': 'Iraq',
        'SY': 'Syria',
        'LB': 'Lebanon',
        'JO': 'Jordan',
        'IL': 'Israel',
        'PS': 'Palestine',
        'KG': 'Kyrgyzstan',
        'TJ': 'Tajikistan',
        'UZ': 'Uzbekistan',
        'TM': 'Turkmenistan',
        'KZ': 'Kazakhstan',
        'MN': 'Mongolia',
        'AE': 'UAE',
        'SA': 'Saudi Arabia',
        'QA': 'Qatar',
        'KW': 'Kuwait',
        'BH': 'Bahrain',
        'OM': 'Oman',
        'YE': 'Yemen',
        'EG': 'Egypt',
        'NG': 'Nigeria',
        'ZA': 'South Africa',
        'KE': 'Kenya',
        'UG': 'Uganda',
        'TZ': 'Tanzania',
        'RW': 'Rwanda',
        'BI': 'Burundi',
        'ET': 'Ethiopia',
        'SO': 'Somalia',
        'DJ': 'Djibouti',
        'SD': 'Sudan',
        'SS': 'South Sudan',
        'TD': 'Chad',
        'CF': 'Central African Republic',
        'CM': 'Cameroon',
        'GQ': 'Equatorial Guinea',
        'GA': 'Gabon',
        'CG': 'Republic of the Congo',
        'CD': 'Democratic Republic of the Congo',
        'AO': 'Angola',
        'ZM': 'Zambia',
        'ZW': 'Zimbabwe',
        'NA': 'Namibia',
        'BW': 'Botswana',
        'SZ': 'Eswatini',
        'LS': 'Lesotho',
        'MG': 'Madagascar',
        'MU': 'Mauritius',
        'SC': 'Seychelles',
        'KM': 'Comoros',
        'MA': 'Morocco',
        'DZ': 'Algeria',
        'TN': 'Tunisia',
        'LY': 'Libya',
        'GM': 'Gambia',
        'SN': 'Senegal',
        'MR': 'Mauritania',
        'ML': 'Mali',
        'GN': 'Guinea',
        'CI': 'Ivory Coast',
        'BF': 'Burkina Faso',
        'NE': 'Niger',
        'TG': 'Togo',
        'BJ': 'Benin',
        'GH': 'Ghana',
        'LR': 'Liberia',
        'SL': 'Sierra Leone',
        'CV': 'Cape Verde',
        'ST': 'São Tomé and Príncipe',
        'BR': 'Brazil',
        'AR': 'Argentina',
        'CL': 'Chile',
        'CO': 'Colombia',
        'PE': 'Peru',
        'VE': 'Venezuela',
        'EC': 'Ecuador',
        'BO': 'Bolivia',
        'PY': 'Paraguay',
        'UY': 'Uruguay',
        'SR': 'Suriname',
        'GY': 'Guyana',
        'GF': 'French Guiana',
        'AU': 'Australia',
        'NZ': 'New Zealand',
        'FJ': 'Fiji',
        'WS': 'Samoa',
        'TO': 'Tonga',
        'VU': 'Vanuatu',
        'NC': 'New Caledonia',
        'PF': 'French Polynesia',
        'CK': 'Cook Islands',
        'TK': 'Tokelau',
        'FM': 'Micronesia',
        'MH': 'Marshall Islands',
        'PW': 'Palau',
        'NR': 'Nauru',
        'NU': 'Niue',
        'AS': 'American Samoa',
        'WF': 'Wallis and Futuna',
        'PG': 'Papua New Guinea',
        'SB': 'Solomon Islands',
        'KI': 'Kiribati',
        'TV': 'Tuvalu',
        'SV': 'El Salvador',
        'GT': 'Guatemala',
        'HN': 'Honduras',
        'NI': 'Nicaragua',
        'CR': 'Costa Rica',
        'PA': 'Panama',
        'BZ': 'Belize',
        'JM': 'Jamaica',
        'CU': 'Cuba',
        'HT': 'Haiti',
        'DO': 'Dominican Republic',
        'PR': 'Puerto Rico',
        'TT': 'Trinidad and Tobago',
        'BB': 'Barbados',
        'BS': 'Bahamas',
        'AG': 'Antigua and Barbuda',
        'LC': 'Saint Lucia',
        'GD': 'Grenada',
        'VC': 'Saint Vincent and the Grenadines',
        'KN': 'Saint Kitts and Nevis',
        'DM': 'Dominica',
      };

      const countryName = countryMap[countryCode];
      if (countryName) {
        const foundCountry = countries.find(country => country.name === countryName);
        if (foundCountry) {
          console.log(`Auto-detected country: ${foundCountry.name} from locale: ${deviceLocale}`);
          return foundCountry;
        }
      }

      console.log(`Could not find country for locale: ${deviceLocale}, defaulting to United States`);
      return countries[0]; // Default to United States if not found
    } catch (error) {
      console.error('Error detecting device country:', error);
      return countries[0]; // Default to United States on error
    }
  };

  const [selectedCountry, setSelectedCountry] = useState(getDefaultCountry());
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [selectedAlphabet, setSelectedAlphabet] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const slideAnim = useRef(new Animated.Value(height)).current;
  const countrySlideAnim = useRef(new Animated.Value(-300)).current;
  const phoneInputRef = useRef<TextInput>(null);

  useEffect(() => {
    // Slide up animation
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  }, []);

  const formatPhoneNumber = (text: string) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');

    // For most countries, use a simple format with spaces every 3-4 digits
    // For US/Canada (+1), use the traditional (XXX) XXX-XXXX format
    if (selectedCountry.code === '+1') {
      // US/Canada format
      if (cleaned.length <= 3) {
        return cleaned.length > 0 ? `(${cleaned}` : '';
      } else if (cleaned.length <= 6) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
      } else if (cleaned.length <= 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
      } else {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
      }
    } else {
      // Generic format for other countries - add spaces every 3-4 digits
      if (cleaned.length <= 3) {
        return cleaned;
      } else if (cleaned.length <= 7) {
        return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
      } else if (cleaned.length <= 10) {
        return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
      } else {
        return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 10)} ${cleaned.slice(10)}`;
      }
    }
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
  };

  const isValidPhone = () => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    return cleaned.length >= selectedCountry.minLength && cleaned.length <= selectedCountry.maxLength;
  };

  const openCountryPicker = () => {
    setShowCountryPicker(true);
    Animated.spring(countrySlideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const closeCountryPicker = () => {
    Animated.timing(countrySlideAnim, {
      toValue: -300,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowCountryPicker(false);
      countrySlideAnim.setValue(-300);
    });
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setPhoneNumber(''); // Clear phone number when country changes
    setSearchQuery(''); // Clear search query
    closeCountryPicker();
  };

  const filteredCountries = countries
    .filter(country => {
      // If there's a search query, filter by search
      if (searchQuery.trim()) {
        return country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
               country.code.includes(searchQuery);
      }

      // If "All" is selected, show all countries
      if (selectedAlphabet === 'All') {
        return true;
      }

      // Otherwise filter by selected alphabet
      return country.name.charAt(0).toUpperCase() === selectedAlphabet;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const alphabets = ['All', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

  const handleSendOTP = async () => {
    if (!isValidPhone()) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      const cleanedPhone = phoneNumber.replace(/\D/g, '');
      const fullPhoneNumber = `${selectedCountry.code}${cleanedPhone}`;

      const response = await ApiService.sendPhoneOTP(fullPhoneNumber);

      if (response.success) {
        navigation.navigate('OTPVerification', {
          phone: fullPhoneNumber,
          verificationType: 'phone',
          userDetails
        });
      } else {
        Alert.alert('Error', response.error || 'Failed to send OTP. Please try again.');
      }
    } catch (error: any) {
      console.error('Send phone OTP error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to send OTP. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('WelcomeAuth');
    }
  };

  return (
    <View style={styles.container}>
      {/* Background gradient flare */}
      <LinearGradient
        colors={['rgba(51, 150, 211, 0.4)', 'rgba(0, 0, 0, 0.8)', 'transparent']}
        style={styles.gradientFlare}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />


      <SafeAreaView style={styles.safeArea}>
        {!showCountryPicker && (
          <View style={styles.header}>
            <Text style={styles.title}>Enter Your Phone Number</Text>
            <Text style={styles.subtitle}>
              We'll send you a verification code to confirm your number
            </Text>
          </View>
        )}

        <Animated.View
          style={[
            showCountryPicker ? styles.fullScreenContainer : styles.slidingContainer,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <LinearGradient
            colors={['rgba(40, 40, 40, 0.1)', 'rgba(30, 30, 30, 0.3)', 'rgba(20, 20, 20, 0.7)']}
            style={styles.gradientBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            {showCountryPicker ? (
              <View style={styles.fullScreenContent}>
                <View style={styles.topBar}>
                  <TouchableOpacity style={styles.backButton} onPress={closeCountryPicker}>
                    <Text style={styles.backButtonText}>←</Text>
                  </TouchableOpacity>
                  <Text style={styles.step}>Select Country</Text>
                </View>

                <View style={styles.searchContainer}>
                  <MaterialIcons name="search" size={20} color="rgba(255, 255, 255, 0.7)" style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search countries..."
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity
                      style={styles.clearButton}
                      onPress={() => setSearchQuery('')}
                    >
                      <MaterialIcons name="clear" size={20} color="rgba(255, 255, 255, 0.7)" />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.fullScreenCountryPicker}>
                  <View style={styles.countryListContainer}>
                    <ScrollView style={styles.inlineCountriesList} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
                    {filteredCountries.map((country, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.inlineCountryItem,
                          selectedCountry.code === country.code &&
                          selectedCountry.name === country.name && styles.selectedInlineCountryItem
                        ]}
                        onPress={() => handleCountrySelect(country)}
                      >
                        <Text style={styles.inlineCountryFlag}>{country.flag}</Text>
                        <View style={styles.inlineCountryInfo}>
                          <Text style={styles.inlineCountryName}>{country.name}</Text>
                          <Text style={styles.inlineCountryCode}>{country.code}</Text>
                        </View>
                        {selectedCountry.code === country.code &&
                         selectedCountry.name === country.name && (
                          <View style={styles.inlineCheckmarkContainer}>
                            <Text style={styles.inlineCheckmark}>✓</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                    </ScrollView>

                    <View style={styles.alphabetSidebar}>
                      <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.alphabetVerticalContent}
                      >
                        {alphabets.map((letter) => (
                          <TouchableOpacity
                            key={letter}
                            style={[
                              styles.alphabetSideButton,
                              selectedAlphabet === letter && styles.selectedAlphabetSideButton
                            ]}
                            onPress={() => setSelectedAlphabet(letter)}
                          >
                            <Text
                              style={[
                                styles.alphabetSideText,
                                selectedAlphabet === letter && styles.selectedAlphabetSideText
                              ]}
                            >
                              {letter}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoid}
                keyboardVerticalOffset={-50}
              >
              <View style={styles.topBar}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                  <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.step}>Step 1 of 5</Text>
              </View>

              <View style={styles.content}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Enter number</Text>
                <View style={styles.phoneInputWrapper}>
                  <TouchableOpacity
                    style={styles.countryCodeButton}
                    onPress={openCountryPicker}
                  >
                    <Text style={styles.flagText}>{selectedCountry.flag}</Text>
                    <Text style={styles.countryCodeText}>{selectedCountry.code}</Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>

                  <TextInput
                    ref={phoneInputRef}
                    style={styles.phoneInput}
                    placeholder={selectedCountry.code === '+1' ? "(555) 555-5555" : "123 456 789"}
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    value={phoneNumber}
                    onChangeText={handlePhoneChange}
                    keyboardType="phone-pad"
                    maxLength={20}
                    returnKeyType="done"
                    selectionColor="#3396D3"
                  />
                </View>


              </View>

            </View>

            <View style={styles.footer}>
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  !isValidPhone() && styles.disabledButton,
                ]}
                onPress={handleSendOTP}
                disabled={!isValidPhone() || loading}
                activeOpacity={0.9}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="large" />
                ) : (
                  <Text style={[
                    styles.continueButtonText,
                    !isValidPhone() && styles.disabledButtonText,
                  ]}>
                    Send Verification Code
                  </Text>
                )}
              </TouchableOpacity>

            </View>
            </KeyboardAvoidingView>
            )}
          </LinearGradient>
        </Animated.View>

      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  gradientFlare: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
    zIndex: 1,
  },
  safeArea: {
    flex: 1,
    zIndex: 2,
  },
  keyboardAvoid: {
    flex: 1,
  },
  backButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 20,
    justifyContent: 'flex-start',
    zIndex: 11,
  },
  header: {
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: 30,
    alignItems: 'center',
    zIndex: 2,
  },
  slidingContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.65,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 10,
  },
  fullScreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  fullScreenContent: {
    flex: 1,
  },
  fullScreenCountryPicker: {
    flex: 1,
    paddingTop: 10,
  },
  gradientBackground: {
    flex: 1,
    paddingTop: 10,
    zIndex: 10,
  },
  stepContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  step: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 15,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 26,
    textAlign: 'center',
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  inputContainer: {
    marginBottom: 20,
    marginTop: 40,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  zipInputWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: 20,
    height: 65,
  },
  zipInput: {
    flex: 1,
    paddingHorizontal: 20,
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingTop: 20,
    paddingBottom: 10,
    zIndex: 12,
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    backgroundColor: 'rgba(51, 150, 211, 0.1)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.2)',
    minWidth: 100,
    justifyContent: 'center',
    height: 56,
  },
  flagText: {
    fontSize: 20,
    marginRight: 8,
  },
  countryCodeText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
    marginRight: 8,
  },
  dropdownArrow: {
    fontSize: 12,
    color: 'rgba(51, 150, 211, 0.7)',
  },
  phoneInput: {
    flex: 1,
    height: 56,
    paddingHorizontal: 20,
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: 0.5,
    backgroundColor: 'transparent',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(51, 150, 211, 0.05)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(51, 150, 211, 0.2)',
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  infoText: {
    flex: 1,
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 22,
    fontWeight: '400',
  },
  footer: {
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  continueButton: {
    height: 56,
    backgroundColor: '#3396D3',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  disabledButtonText: {
    color: 'rgba(255, 255, 255, 0.4)',
  },
  termsText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '400',
  },
  termsLink: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  countryPickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  countryPickerContainer: {
    backgroundColor: 'rgba(40, 40, 40, 0.95)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: '60%',
    paddingBottom: 34,
  },
  countryPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  pickerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  countriesList: {
    maxHeight: 400,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  selectedCountryItem: {
    backgroundColor: 'rgba(51, 150, 211, 0.1)',
  },
  countryFlag: {
    fontSize: 24,
    marginRight: 15,
  },
  countryInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  countryCode: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  checkmarkContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3396D3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  inlineCountryPicker: {
    backgroundColor: 'rgba(20, 20, 20, 0.7)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: 20,
    marginHorizontal: -30,
    flex: 1,
    zIndex: 1000,
  },
  inlinePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  pickerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  inlinePickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  inlineCountriesList: {
    flex: 1,
    paddingHorizontal: 30,
  },
  inlineCountryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  selectedInlineCountryItem: {
    backgroundColor: 'rgba(51, 150, 211, 0.15)',
  },
  inlineCountryFlag: {
    fontSize: 20,
    marginRight: 15,
  },
  inlineCountryInfo: {
    flex: 1,
  },
  inlineCountryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  inlineCountryCode: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  inlineCheckmarkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3396D3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineCheckmark: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginHorizontal: 30,
    marginBottom: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  clearButton: {
    marginLeft: 10,
    padding: 2,
  },
  countryListContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  alphabetSidebar: {
    width: 30,
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  alphabetVerticalContent: {
    alignItems: 'center',
  },
  alphabetSideButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 1,
  },
  selectedAlphabetSideButton: {
    backgroundColor: '#3396D3',
  },
  alphabetSideText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  selectedAlphabetSideText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default PhoneInputScreen;