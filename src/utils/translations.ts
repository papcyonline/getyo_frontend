export interface LanguageTranslations {
  // Language Selection Screen
  title: string;
  subtitle: string;
  continue: string;
  saving: string;
  languageUpdated: string;
  languageUpdatedMessage: string;
  error: string;
  errorMessage: string;
  ok: string;

  // Welcome Screen
  welcome: {
    title: string;
    meetTitle: string;
    subtitle: string;
    getStarted: string;
    alreadyHaveAccount: string;
    signIn: string;
    description: string;
    signUp: string;
    features: {
      smartTaskManagement: string;
      smartTaskManagementDesc: string;
      naturalConversations: string;
      naturalConversationsDesc: string;
      intelligentScheduling: string;
      intelligentSchedulingDesc: string;
      seamlessIntegration: string;
      seamlessIntegrationDesc: string;
      proactiveReminders: string;
      proactiveRemindersDesc: string;
      deadlineTracking: string;
      deadlineTrackingDesc: string;
    };
    footerText: string;
    orContinueWith: string;
  };

  // Terms & Privacy Screen
  termsPrivacy: {
    title: string;
    mainTitle: string;
    subtitle: string;
    progressText: string;
    readyToContinue: string;
    slideToAccept: string;
    termsSection: string;
    privacySection: string;
    serviceAgreement: string;
    serviceAgreementText: string;
    responsibilities: string;
    responsibilitiesText: string;
    aiTechnology: string;
    aiTechnologyText: string;
    serviceAvailability: string;
    serviceAvailabilityText: string;
    limitations: string;
    limitationsText: string;
    dataWeCollect: string;
    dataWeCollectText: string;
    howWeUseData: string;
    howWeUseDataText: string;
    dataProtection: string;
    dataProtectionText: string;
    privacyRights: string;
    privacyRightsText: string;
    thirdPartyServices: string;
    thirdPartyServicesText: string;
    dataRetention: string;
    dataRetentionText: string;
    contactSupport: string;
    contactSupportText: string;
    finalAgreement: string;
    accepted: string;
    readyToContinueAfterAccept: string;
  };

  // User Details Screen
  userDetails: {
    title: string;
    mainTitle: string;
    subtitle: string;
    fullName: string;
    fullNamePlaceholder: string;
    fullNameDescription: string;
    preferredName: string;
    preferredNamePlaceholder: string;
    preferredNameDescription: string;
    titleOptional: string;
    titlePlaceholder: string;
    titleDescription: string;
    requiredField: string;
    enterFullName: string;
    enterPreferredName: string;
  };

  // Sign In Screen
  signIn: {
    title: string;
    subtitle: string;
    email: string;
    emailPlaceholder: string;
    password: string;
    passwordPlaceholder: string;
    signInButton: string;
    forgotPassword: string;
    noAccount: string;
    signUp: string;
    orContinueWith: string;
    google: string;
    apple: string;
    invalidCredentials: string;
    fillAllFields: string;
    invalidEmail: string;
    passwordTooShort: string;
    signInFailed: string;
    tryAgain: string;
    rememberMe: string;
  };

  // Phone Input Screen
  phoneInput: {
    title: string;
    subtitle: string;
    phoneNumber: string;
    phoneNumberPlaceholder: string;
    sendCode: string;
    invalidPhoneNumber: string;
    enterPhoneNumber: string;
    codeSent: string;
    codeSentTo: string;
  };

  // Common
  common: {
    back: string;
    next: string;
    skip: string;
    done: string;
    cancel: string;
    save: string;
    loading: string;
    success: string;
    failed: string;
    retry: string;
  };
}

import { getCompleteTranslations } from './autoTranslate';

export const translations: Record<string, Partial<LanguageTranslations>> = {
  en: {
    title: 'Choose Your Language',
    subtitle: 'Scroll to select your preferred language for Yo!',
    continue: 'Continue',
    saving: 'Saving...',
    languageUpdated: 'Language Updated',
    languageUpdatedMessage: 'Your language has been set to',
    error: 'Error',
    errorMessage: 'Failed to update language preference. Please try again.',
    ok: 'OK',

    welcome: {
      title: 'Welcome to Yo!',
      meetTitle: 'Meet Yo!',
      subtitle: 'Your AI-powered personal assistant for executive productivity',
      getStarted: 'Get Started',
      alreadyHaveAccount: 'Already have an account?',
      signIn: 'Sign In',
      description: 'I\'m available anytime you need me',
      signUp: 'Sign Up',
      features: {
        smartTaskManagement: 'Smart Task Management',
        smartTaskManagementDesc: 'AI prioritizes and organizes your work',
        naturalConversations: 'Natural Conversations',
        naturalConversationsDesc: 'Talk to your assistant like a friend',
        intelligentScheduling: 'Intelligent Scheduling',
        intelligentSchedulingDesc: 'Never double-book or miss meetings',
        seamlessIntegration: 'Seamless Integration',
        seamlessIntegrationDesc: 'Connect all your apps and tools',
        proactiveReminders: 'Proactive Reminders',
        proactiveRemindersDesc: 'Get notified before you need to act',
        deadlineTracking: 'Deadline Tracking',
        deadlineTrackingDesc: 'Stay on top of all your commitments',
      },
      footerText: 'Secure registration with end-to-end encryption',
      orContinueWith: 'OR',
    },

    termsPrivacy: {
      title: 'Terms & Privacy',
      mainTitle: 'Terms of Service & Privacy Policy',
      subtitle: 'By using Yo! Personal Assistant, you agree to these terms and our privacy practices. Please scroll through and read the complete agreement below.',
      progressText: '% read',
      readyToContinue: 'Ready to continue',
      slideToAccept: 'Slide to accept',
      termsSection: '📋 Terms of Service',
      privacySection: '🔒 Privacy Policy',
      serviceAgreement: '1. Service Agreement',
      serviceAgreementText: 'Yo! is an AI-powered personal assistant that helps you manage tasks, schedule events, and integrate with productivity tools. By using our service, you agree to these terms and all applicable laws.',
      responsibilities: '2. Your Responsibilities',
      responsibilitiesText: '• Use the service lawfully and responsibly\n• Provide accurate information when required\n• Maintain account security and confidentiality\n• Respect intellectual property and user rights\n• Report security issues or inappropriate usage',
      aiTechnology: '3. AI Technology & Learning',
      aiTechnologyText: 'Our AI processes your interactions to provide personalized assistance and improve service quality. The system learns from your preferences to better serve your needs while maintaining privacy safeguards.',
      serviceAvailability: '4. Service Availability',
      serviceAvailabilityText: 'We strive for 99.9% uptime but cannot guarantee uninterrupted service. Scheduled maintenance and updates may temporarily affect availability.',
      limitations: '5. Limitations & Liability',
      limitationsText: 'The service is provided "as is" with reasonable care but no warranties. Our liability is limited to the maximum extent permitted by law.',
      dataWeCollect: 'Data We Collect',
      dataWeCollectText: '• Profile information (name, email, phone, preferences)\n• Usage patterns (commands, interactions, feature usage)\n• Device data (IP address, device type, app version)\n• Voice recordings (only when using voice features)\n• Location data (only when explicitly enabled)',
      howWeUseData: 'How We Use Your Data',
      howWeUseDataText: 'We use your information to provide personalized assistance, improve our AI models, ensure service security, and develop new features. All processing is done with your consent and in accordance with privacy laws.',
      dataProtection: 'Data Protection & Security',
      dataProtectionText: '• End-to-end encryption for sensitive data\n• Regular security audits and monitoring\n• Strict access controls and authentication\n• Compliance with GDPR, CCPA, and privacy regulations\n• Secure cloud infrastructure with backup systems',
      privacyRights: 'Your Privacy Rights',
      privacyRightsText: '• Access and review your personal data\n• Correct inaccurate information\n• Request deletion of your account and data\n• Export your data (data portability)\n• Opt out of non-essential data processing\n• Control third-party integrations and permissions',
      thirdPartyServices: 'Third-Party Services',
      thirdPartyServicesText: 'When you connect external services (Gmail, Calendar, etc.), we access only the minimum data necessary for functionality. We never sell your personal information to third parties.',
      dataRetention: 'Data Retention',
      dataRetentionText: 'We retain your data only as long as necessary to provide services or as required by law. You can request deletion at any time through your account settings or by contacting support.',
      contactSupport: 'Contact & Support',
      contactSupportText: 'For privacy questions or data requests, contact our Data Protection Officer at privacy@yo-assistant.com. For general support, use the in-app help or visit our support center.',
      finalAgreement: '✨ By continuing, you acknowledge that you have read and agree to these Terms of Service and Privacy Policy.',
      accepted: '✓ Terms & Privacy Accepted',
      readyToContinueAfterAccept: 'Ready to continue',
    },

    userDetails: {
      title: 'User Details',
      mainTitle: 'Tell us about yourself',
      subtitle: 'Your Personal Assistant will use this information for bookings, appointments, and professional communications on your behalf.',
      fullName: 'Full Name *',
      fullNamePlaceholder: 'e.g., John Michael Smith',
      fullNameDescription: 'Your legal name for official bookings and appointments',
      preferredName: 'Preferred Name *',
      preferredNamePlaceholder: 'e.g., John or Mike',
      preferredNameDescription: 'What you\'d like your assistant to call you',
      titleOptional: 'Title (Optional)',
      titlePlaceholder: 'e.g., Mr., Dr., Prof.',
      titleDescription: 'Professional title for formal communications',
      requiredField: 'Required Field',
      enterFullName: 'Please enter your full name.',
      enterPreferredName: 'Please enter your preferred name.',
    },

    signIn: {
      title: 'Welcome Back',
      subtitle: 'Sign in to your Yo! account to continue',
      email: 'Email',
      emailPlaceholder: 'Enter your email',
      password: 'Password',
      passwordPlaceholder: 'Enter your password',
      signInButton: 'Sign In',
      forgotPassword: 'Forgot Password?',
      noAccount: 'Don\'t have an account?',
      signUp: 'Sign Up',
      orContinueWith: 'Or continue with',
      google: 'Google',
      apple: 'Apple',
      invalidCredentials: 'Invalid Credentials',
      fillAllFields: 'Please fill in all fields.',
      invalidEmail: 'Please enter a valid email address.',
      passwordTooShort: 'Password must be at least 6 characters.',
      signInFailed: 'Sign in failed. Please check your credentials.',
      tryAgain: 'Try Again',
      rememberMe: 'Remember me',
    },

    phoneInput: {
      title: 'Phone Verification',
      subtitle: 'We\'ll send a verification code to confirm your phone number',
      phoneNumber: 'Phone Number',
      phoneNumberPlaceholder: 'Enter your phone number',
      sendCode: 'Send Code',
      invalidPhoneNumber: 'Invalid Phone Number',
      enterPhoneNumber: 'Please enter a valid phone number.',
      codeSent: 'Code Sent',
      codeSentTo: 'Verification code sent to',
    },

    common: {
      back: 'Back',
      next: 'Next',
      skip: 'Skip',
      done: 'Done',
      cancel: 'Cancel',
      save: 'Save',
      loading: 'Loading...',
      success: 'Success',
      failed: 'Failed',
      retry: 'Retry',
    },
  },
  es: {
    title: 'Elige tu Idioma',
    subtitle: 'Desplázate para seleccionar tu idioma preferido para Yo!',
    continue: 'Continuar',
    saving: 'Guardando...',
    languageUpdated: 'Idioma Actualizado',
    languageUpdatedMessage: 'Tu idioma se ha establecido a',
    error: 'Error',
    errorMessage: 'No se pudo actualizar la preferencia de idioma. Por favor, inténtalo de nuevo.',
    ok: 'OK',
  },
  fr: {
    title: 'Choisissez Votre Langue',
    subtitle: 'Faites défiler pour sélectionner votre langue préférée pour Yo!',
    continue: 'Continuer',
    saving: 'Enregistrement...',
    languageUpdated: 'Langue Mise à Jour',
    languageUpdatedMessage: 'Votre langue a été définie sur',
    error: 'Erreur',
    errorMessage: 'Échec de la mise à jour de la préférence de langue. Veuillez réessayer.',
    ok: 'OK',
  },
  de: {
    title: 'Wählen Sie Ihre Sprache',
    subtitle: 'Scrollen Sie, um Ihre bevorzugte Sprache für Yo! auszuwählen',
    continue: 'Weiter',
    saving: 'Speichern...',
    languageUpdated: 'Sprache Aktualisiert',
    languageUpdatedMessage: 'Ihre Sprache wurde auf',
    error: 'Fehler',
    errorMessage: 'Spracheinstellung konnte nicht aktualisiert werden. Bitte versuchen Sie es erneut.',
    ok: 'OK',
  },
  it: {
    title: 'Scegli la Tua Lingua',
    subtitle: 'Scorri per selezionare la tua lingua preferita per Yo!',
    continue: 'Continua',
    saving: 'Salvando...',
    languageUpdated: 'Lingua Aggiornata',
    languageUpdatedMessage: 'La tua lingua è stata impostata su',
    error: 'Errore',
    errorMessage: 'Impossibile aggiornare la preferenza della lingua. Riprova.',
    ok: 'OK',
  },
  pt: {
    title: 'Escolha Seu Idioma',
    subtitle: 'Role para selecionar seu idioma preferido para Yo!',
    continue: 'Continuar',
    saving: 'Salvando...',
    languageUpdated: 'Idioma Atualizado',
    languageUpdatedMessage: 'Seu idioma foi definido para',
    error: 'Erro',
    errorMessage: 'Falha ao atualizar a preferência de idioma. Tente novamente.',
    ok: 'OK',
  },
  ru: {
    title: 'Выберите Ваш Язык',
    subtitle: 'Прокрутите, чтобы выбрать предпочитаемый язык для Yo!',
    continue: 'Продолжить',
    saving: 'Сохранение...',
    languageUpdated: 'Язык Обновлен',
    languageUpdatedMessage: 'Ваш язык установлен на',
    error: 'Ошибка',
    errorMessage: 'Не удалось обновить предпочтение языка. Пожалуйста, попробуйте снова.',
    ok: 'ОК',
  },
  zh: {
    title: '选择您的语言',
    subtitle: '滚动选择您的Yo!首选语言',
    continue: '继续',
    saving: '保存中...',
    languageUpdated: '语言已更新',
    languageUpdatedMessage: '您的语言已设置为',
    error: '错误',
    errorMessage: '更新语言首选项失败。请重试。',
    ok: '确定',
  },
  ja: {
    title: '言語を選択',
    subtitle: 'Yo!の希望言語を選択するためにスクロールしてください',
    continue: '続行',
    saving: '保存中...',
    languageUpdated: '言語が更新されました',
    languageUpdatedMessage: 'あなたの言語が設定されました',
    error: 'エラー',
    errorMessage: '言語設定の更新に失敗しました。もう一度お試しください。',
    ok: 'OK',
  },
  ko: {
    title: '언어 선택',
    subtitle: 'Yo!의 선호 언어를 선택하려면 스크롤하세요',
    continue: '계속',
    saving: '저장 중...',
    languageUpdated: '언어 업데이트됨',
    languageUpdatedMessage: '귀하의 언어가 다음으로 설정되었습니다',
    error: '오류',
    errorMessage: '언어 환경설정 업데이트에 실패했습니다. 다시 시도해 주세요.',
    ok: '확인',
  },
  ar: {
    title: 'اختر لغتك',
    subtitle: 'مرر لتحديد لغتك المفضلة لـ Yo!',
    continue: 'متابعة',
    saving: 'حفظ...',
    languageUpdated: 'تم تحديث اللغة',
    languageUpdatedMessage: 'تم تعيين لغتك إلى',
    error: 'خطأ',
    errorMessage: 'فشل في تحديث تفضيل اللغة. يرجى المحاولة مرة أخرى.',
    ok: 'موافق',
  },
  hi: {
    title: 'अपनी भाषा चुनें',
    subtitle: 'Yo! के लिए अपनी पसंदीदा भाषा का चयन करने के लिए स्क्रॉल करें',
    continue: 'जारी रखें',
    saving: 'सहेजा जा रहा है...',
    languageUpdated: 'भाषा अपडेट की गई',
    languageUpdatedMessage: 'आपकी भाषा सेट की गई है',
    error: 'त्रुटि',
    errorMessage: 'भाषा प्राथमिकता अपडेट करने में विफल। कृपया पुनः प्रयास करें।',
    ok: 'ठीक है',
  },
};

export const getTranslations = (languageCode: string): LanguageTranslations => {
  // Use auto-generated complete translations for all languages
  return getCompleteTranslations(languageCode);
};