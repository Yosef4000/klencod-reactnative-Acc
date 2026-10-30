import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  SafeAreaView,
  StatusBar,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [accounts, setAccounts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [platform, setPlatform] = useState('');
  const [recovery, setRecovery] = useState('');
  const [notes, setNotes] = useState('');
  const [showPassword, setShowPassword] = useState({});

  const STORAGE_KEY = '@google_accounts_manager_data';

  useEffect(() => {
    loadAccounts();
  }, []);

  // استرجاع البيانات المخزنة محلياً
  const loadAccounts = async () => {
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedData) {
        setAccounts(JSON.parse(storedData));
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل في استرجاع البيانات المحفوظة');
    }
  };

  // حفظ البيانات محلياً داخل التطبيق
  const saveAccounts = async (newAccounts) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newAccounts));
      setAccounts(newAccounts);
    } catch (error) {
      Alert.alert('خطأ', 'فشل في حفظ البيانات محلياً');
    }
  };

  // إضافة أو تعديل حساب
  const handleSaveAccount = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال البريد الإلكتروني وكلمة المرور على الأقل.');
      return;
    }

    if (editingId) {
      const updated = accounts.map((acc) =>
        acc.id === editingId
          ? { ...acc, email: email.trim(), password: password.trim(), platform: platform.trim() || 'عام', recovery: recovery.trim(), notes: notes.trim() }
          : acc
      );
      saveAccounts(updated);
    } else {
      const newAccount = {
        id: Date.now().toString(),
        email: email.trim(),
        password: password.trim(),
        platform: platform.trim() || 'عام',
        recovery: recovery.trim(),
        notes: notes.trim(),
        createdAt: new Date().toLocaleDateString('ar-SA'),
      };
      saveAccounts([newAccount, ...accounts]);
    }

    resetForm();
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setPlatform('');
    setRecovery('');
    setNotes('');
    setEditingId(null);
    setModalVisible(false);
  };

  const handleEdit = (account) => {
    setEmail(account.email);
    setPassword(account.password);
    setPlatform(account.platform);
    setRecovery(account.recovery || '');
    setNotes(account.notes || '');
    setEditingId(account.id);
    setModalVisible(true);
  };

  const handleDelete = (id) => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من رغبتك في حذف هذا الحساب نهائياً من التطبيق؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: () => {
            const filtered = accounts.filter((acc) => acc.id !== id);
            saveAccounts(filtered);
          },
        },
      ]
    );
  };

  const togglePasswordVisibility = (id) => {
    setShowPassword((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredAccounts = accounts.filter(
    (acc) =>
      acc.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.platform.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a73e8" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>إدارة حسابات غوغل</Text>
        <Text style={styles.headerSubtitle}>إدارة وربط الحسابات بالمنصات محلياً وبأمان</Text>
      </View>

      {/* Search & Add Action Row */}
      <View style={styles.actionRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="بحث بالبريد أو المنصة المرتبطة..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setModalVisible(true);
          }}
        >
          <Text style={styles.addButtonText}>+ إضافة حساب</Text>
        </TouchableOpacity>
      </View>

      {/* Accounts List / Empty State */}
      {accounts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🛡️</Text>
          <Text style={styles.emptyTitle}>لا توجد حسابات مضافة حتى الآن</Text>
          <Text style={styles.emptySubtitle}>
            ابدأ بإضافة أول حساب غوغل عبر زر "إضافة حساب" في الأعلى لتخزينه مباشرة داخل التطبيق.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredAccounts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.platformBadge}>
                  <Text style={styles.platformText}>{item.platform}</Text>
                </View>
                <Text style={styles.dateText}>{item.createdAt}</Text>
              </View>

              <Text style={styles.emailText} selectable>
                📧 {item.email}
              </Text>

              <View style={styles.passwordRow}>
                <Text style={styles.passwordLabel}>كلمة المرور:</Text>
                <Text style={styles.passwordText} selectable>
                  {showPassword[item.id] ? item.password : '••••••••••••'}
                </Text>
                <TouchableOpacity
                  onPress={() => togglePasswordVisibility(item.id)}
                  style={styles.toggleBtn}
                >
                  <Text style={styles.toggleBtnText}>
                    {showPassword[item.id] ? 'إخفاء' : 'إظهار'}
                  </Text>
                </TouchableOpacity>
              </View>

              {item.recovery ? (
                <Text style={styles.metaText} selectable>
                  🔄 البريد البديل: {item.recovery}
                </Text>
              ) : null}

              {item.notes ? (
                <Text style={styles.metaText} selectable>
                  📝 ملاحظات: {item.notes}
                </Text>
              ) : null}

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.editBtn]}
                  onPress={() => handleEdit(item)}
                >
                  <Text style={styles.actionBtnText}>تعديل</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.deleteBtn]}
                  onPress={() => handleDelete(item.id)}
                >
                  <Text style={styles.actionBtnText}>حذف</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Modal Form for Add / Edit */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={resetForm}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingId ? 'تعديل بيانات الحساب' : 'إضافة حساب غوغل جديد'}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>البريد الإلكتروني (Gmail) *</Text>
              <TextInput
                style={styles.input}
                placeholder="example@gmail.com"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <Text style={styles.label}>كلمة المرور *</Text>
              <TextInput
                style={styles.input}
                placeholder="كلمة المرور الخاصة بالحساب"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <Text style={styles.label}>المنصة أو التطبيق المرتبط</Text>
              <TextInput
                style={styles.input}
                placeholder="مثال: يوتيوب، تيك توك، إعلانات..."
                placeholderTextColor="#999"
                value={platform}
                onChangeText={setPlatform}
              />

              <Text style={styles.label}>البريد البديل / الاسترداد (اختياري)</Text>
              <TextInput
                style={styles.input}
                placeholder="recovery@gmail.com"
                placeholderTextColor="#999"
                value={recovery}
                onChangeText={setRecovery}
                autoCapitalize="none"
              />

              <Text style={styles.label}>ملاحظات إضافية (اختياري)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="تفاصيل حالة الحساب أو رابط المنصة..."
                placeholderTextColor="#999"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.cancelBtn]}
                  onPress={resetForm}
                >
                  <Text style={styles.cancelBtnText}>إلغاء</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBtn, styles.saveBtn]}
                  onPress={handleSaveAccount}
                >
                  <Text style={styles.saveBtnText}>حفظ الحساب</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f9',
  },
  header: {
    backgroundColor: '#1a73e8',
    padding: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#e8f0fe',
    marginTop: 4,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row-reverse',
    padding: 15,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 45,
    textAlign: 'right',
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
  },
  addButton: {
    backgroundColor: '#1a73e8',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  listContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  platformBadge: {
    backgroundColor: '#e8f0fe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  platformText: {
    color: '#1a73e8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 11,
    color: '#888',
  },
  emailText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#202124',
    textAlign: 'right',
    marginBottom: 8,
  },
  passwordRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 6,
  },
  passwordLabel: {
    fontSize: 12,
    color: '#5f6368',
    marginLeft: 5,
  },
  passwordText: {
    fontSize: 13,
    color: '#3c4043',
    flex: 1,
    textAlign: 'right',
  },
  toggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#f1f3f4',
    borderRadius: 4,
  },
  toggleBtnText: {
    fontSize: 11,
    color: '#1a73e8',
    fontWeight: '600',
  },
  metaText: {
    fontSize: 12,
    color: '#5f6368',
    textAlign: 'right',
    marginTop: 4,
  },
  cardActions: {
    flexDirection: 'row-reverse',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
    paddingTop: 10,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginLeft: 10,
  },
  editBtn: {
    backgroundColor: '#f1f3f4',
  },
  deleteBtn: {
    backgroundColor: '#fce8e6',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3c4043',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    marginTop: 60,
  },
  emptyEmoji: {
    fontSize: 45,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#3c4043',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#70757a',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#202124',
    textAlign: 'right',
    marginBottom: 15,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3c4043',
    textAlign: 'right',
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    textAlign: 'right',
    fontSize: 13,
    color: '#202124',
  },
  textArea: {
    height: 75,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  modalButtons: {
    flexDirection: 'row-reverse',
    marginTop: 20,
    marginBottom: 15,
  },
  modalBtn: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#f1f3f4',
    marginLeft: 10,
  },
  cancelBtnText: {
    color: '#3c4043',
    fontWeight: 'bold',
    fontSize: 13,
  },
  saveBtn: {
    backgroundColor: '#1a73e8',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
});