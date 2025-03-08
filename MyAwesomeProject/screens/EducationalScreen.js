import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions, 
  StatusBar, 
  ScrollView, 
  TextInput 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// Пример данных образовательного контента
const EDUCATIONAL_CONTENT = [
  {
    id: 1,
    title: 'Introduction to Neuroscience',
    content: 'Neuroscience is the study of the nervous system. This course covers the basics of neural structure and function...',
    category: 'Neuroscience',
    created_at: '2025-02-25',
  },
  {
    id: 2,
    title: 'Cognitive Psychology Essentials',
    content: 'This module explores fundamental concepts in cognitive psychology including perception, memory, and problem solving...',
    category: 'Psychology',
    created_at: '2025-02-20',
  },
  {
    id: 3,
    title: 'Developing a Growth Mindset',
    content: 'A growth mindset is essential for personal development. This session includes practical exercises and techniques...',
    category: 'Mindset',
    created_at: '2025-02-15',
  },
  {
    id: 4,
    title: 'Productivity Hacks for Professionals',
    content: 'Increase your productivity with proven techniques and tools. Learn time management strategies and workflow optimization...',
    category: 'Productivity',
    created_at: '2025-02-10',
  },
];

const CATEGORIES = ['All', 'Neuroscience', 'Psychology', 'Mindset', 'Productivity'];

export default function EducationalScreen({ navigation }) {
  const [selectedContent, setSelectedContent] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Фильтрация контента по выбранной категории и поисковому запросу
  const filteredContent = EDUCATIONAL_CONTENT.filter(item => {
    const matchCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const closeContentDetails = () => {
    setSelectedContent(null);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Компонент LinearGradient (с colors) отвечает за фон */}
      <LinearGradient colors={['#121539', '#080b20']} style={styles.background}>
        {/* Фон с частицами */}
        <View style={styles.particlesContainer}>
          {[...Array(20)].map((_, i) => (
            <View 
              key={i}
              style={[
                styles.particle, 
                {
                  left: Math.random() * width,
                  top: Math.random() * height,
                  width: Math.random() * 4 + 1,
                  height: Math.random() * 4 + 1,
                  opacity: Math.random() * 0.5 + 0.3
                }
              ]}
            />
          ))}
        </View>

        {/* Хедер */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Educational Content</Text>
          {/* Кнопка добавления образовательного контента */}
          <TouchableOpacity 
            style={styles.addContentButton} 
            onPress={() => navigation.navigate('AddEducationalContent')}
          >
            <Ionicons name="add-circle-outline" size={24} color="#4dabf7" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Profile')}>
            <View style={styles.profileImage}>
              <Text style={styles.profileInitial}>E</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Поисковая строка */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#c8d6e5" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search educational content..."
            placeholderTextColor="#c8d6e5"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Фильтрация по категориям */}
        <ScrollView 
          horizontal={true} 
          showsHorizontalScrollIndicator={false} 
          style={styles.categoriesContainer}
        >
          {CATEGORIES.map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryItem,
                activeCategory === category && styles.categoryItemActive
              ]}
              onPress={() => setActiveCategory(category)}
            >
              <Text style={[
                styles.categoryText,
                activeCategory === category && styles.categoryTextActive
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Основной контент */}
        <View style={styles.mainContent}>
          <ScrollView style={styles.contentContainer}>
            {filteredContent.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.contentItem}
                onPress={() => setSelectedContent(item)}
              >
                <View style={styles.contentInfo}>
                  <Text style={styles.contentTitle}>{item.title}</Text>
                  <Text style={styles.contentSnippet}>
                    {item.content.substring(0, 60)}...
                  </Text>
                </View>
                <View style={styles.contentMeta}>
                  <Text style={styles.contentCategory}>{item.category}</Text>
                  <Text style={styles.contentDate}>{item.created_at}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Нижняя навигация */}
        <View style={styles.bottomNav}>
          <LinearGradient
            colors={['rgba(16, 20, 45, 0.9)', 'rgba(16, 20, 45, 0.75)']}
            style={styles.navBackground}
          >
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
              <MaterialCommunityIcons name="sword-cross" size={24} color="#4dabf7" />
              <Text style={styles.navText}>Quests</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Pomodoro')}>
              <MaterialIcons name="timer" size={24} color="#4dabf7" />
              <Text style={styles.navText}>Timer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Nutrition')}>
              <MaterialCommunityIcons name="food-apple" size={24} color="#4dabf7" />
              <Text style={styles.navText}>Calories</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Groups')}>
              <Ionicons name="people" size={24} color="#4dabf7" />
              <Text style={styles.navText}>Guild</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Learn')}>
              <FontAwesome5 name="book" size={24} color="#4dabf7" />
              <Text style={styles.navText}>Learn</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Модальное окно деталей образовательного контента */}
        {selectedContent && (
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={styles.modalBackground} onPress={closeContentDetails} />
            <View style={styles.contentDetailsModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedContent.title}</Text>
                <TouchableOpacity style={styles.closeButton} onPress={closeContentDetails}>
                  <Ionicons name="close" size={20} color="#ffffff" />
                </TouchableOpacity>
              </View>
              <View style={styles.modalContent}>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Category:</Text>
                  <Text style={styles.modalInfoValue}>{selectedContent.category}</Text>
                </View>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Created At:</Text>
                  <Text style={styles.modalInfoValue}>{selectedContent.created_at}</Text>
                </View>
                <View style={styles.descriptionContainer}>
                  <Text style={styles.descriptionLabel}>Content:</Text>
                  <Text style={styles.descriptionText}>{selectedContent.content}</Text>
                </View>
                {/* Кнопки действий: редактировать и удалить */}
                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.actionButton}>
                    <LinearGradient
                      colors={['#4dabf7', '#3250b4']}
                      style={styles.buttonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.buttonText}>Edit</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, { marginLeft: 10 }]}>
                    <LinearGradient
                      colors={['#ff2d55', '#d11a3a']}
                      style={styles.buttonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.buttonText}>Delete</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  particlesContainer: {
    position: 'absolute',
    width: width,
    height: height,
  },
  particle: {
    position: 'absolute',
    backgroundColor: '#4dabf7',
    borderRadius: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(77, 171, 247, 0.3)',
  },
  headerTitle: {
    flex: 1,
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  addContentButton: {
    marginRight: 10,
  },
  profileButton: {
    marginLeft: 15,
  },
  profileImage: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#3250b4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4dabf7',
  },
  profileInitial: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 20, 45, 0.75)',
    marginHorizontal: 20,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
  },
  categoriesContainer: {
    marginTop: 15,
    maxHeight: 40,
    paddingHorizontal: 20,
  },
  categoryItem: {
    backgroundColor: 'rgba(16, 20, 45, 0.75)',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
  },
  categoryItemActive: {
    backgroundColor: '#4dabf7',
  },
  categoryText: {
    color: '#c8d6e5',
    fontSize: 14,
  },
  categoryTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  contentContainer: {
    flex: 1,
  },
  contentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 20, 45, 0.75)',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3250b4',
  },
  contentInfo: {
    flex: 1,
  },
  contentTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  contentSnippet: {
    color: '#c8d6e5',
    fontSize: 12,
  },
  contentMeta: {
    alignItems: 'flex-end',
  },
  contentCategory: {
    color: '#4dabf7',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  contentDate: {
    color: '#c8d6e5',
    fontSize: 10,
  },
  bottomNav: {
    width: '100%',
    paddingBottom: 20,
  },
  navBackground: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(77, 171, 247, 0.3)',
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    color: '#c8d6e5',
    fontSize: 10,
    marginTop: 5,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  contentDetailsModal: {
    width: width * 0.85,
    backgroundColor: 'rgba(16, 20, 45, 0.95)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4dabf7',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3250b4',
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  modalTitle: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  modalContent: {
    padding: 20,
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(77, 171, 247, 0.2)',
    paddingBottom: 8,
  },
  modalInfoLabel: {
    color: '#c8d6e5',
    fontSize: 14,
  },
  modalInfoValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  descriptionLabel: {
    color: '#c8d6e5',
    fontSize: 14,
    marginBottom: 8,
  },
  descriptionText: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    height: 40,
    borderRadius: 6,
    overflow: 'hidden',
    flex: 1,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

