// import React, { useState } from 'react';
// import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
// const CustomAlert = ({ visible, title, message, onClose }) => {
//   return (
//     <Modal
//       animationType="fade"
//       transparent={true}
//       visible={visible}
//       onRequestClose={onClose}
//     >
//       <View style={styles.modalOverlay}>
//         <View style={styles.modalContainer}>
//           <Text style={styles.modalTitle}>{title}</Text>
//           <Text style={styles.modalMessage}>{message}</Text>
//           <TouchableOpacity onPress={onClose} style={styles.modalButton}>
//             <Text style={styles.modalButtonText}>OK</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </Modal>
//   );
// };
// const styles = StyleSheet.create({
//   modalOverlay: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dimmed background
//   },
//   modalContainer: {
//     width: 300,
//     padding: 20,
//     backgroundColor: 'white',
//     borderRadius: 10,
//     alignItems: 'center',
//     justifyContent: 'center',
//     elevation: 5, // Shadow effect for Android
//   },
//   modalTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginBottom: 10,
//   },
//   modalMessage: {
//     fontSize: 16,
//     marginBottom: 20,
//     textAlign: 'center',
//   },
//   modalButton: {
//     backgroundColor: '#09B368',
//     paddingVertical: 10,
//     paddingHorizontal: 20,
//     borderRadius: 5,
//   },
//   modalButtonText: {
//     color: 'white',
//     fontSize: 16,
//   },
// });
// export default CustomAlert;
import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons'; // Requires this library

const { width } = Dimensions.get('window');

const CustomAlert = ({
  visible,
  title,
  message,
  onClose,
  type = 'error', // 'success' or 'error'
  buttonText = 'Close',
}) => {
  const alertConfig = {
    success: {
      iconName: 'checkmark-circle',
      color: '#00C851', // A vibrant green
    },
    error: {
      iconName: 'warning',
      color: '#FF4444', // A bold red
    },
  };

  const currentConfig = alertConfig[type];

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Side Indicator */}
          <View style={[styles.sideIndicator, { backgroundColor: currentConfig.color }]} />

          {/* Icon */}
          <View style={styles.iconWrapper}>
            <Icon
              name={currentConfig.iconName}
              size={28}
              color={currentConfig.color}
            />
          </View>

          {/* Content */}
          <View style={styles.contentWrapper}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
          </View>

          {/* Button */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: currentConfig.color }]}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>{buttonText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: width * 0.8,
    backgroundColor: 'white',
    borderRadius: 12,
    flexDirection: 'column', // Changed to column for vertical layout
    alignItems: 'center', // Center everything horizontally
    padding: 25,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  sideIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 8,
  },
  iconWrapper: {
    marginBottom: 15, // Added space below the icon
  },
  contentWrapper: {
    marginBottom: 20, // Added space between message and button
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
    textAlign: 'center', // Centered title
  },
  message: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    textAlign: 'center', // Centered message
  },
  button: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    width: '100%', // Full-width button
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center', // Centered button text
  },
});

export default CustomAlert;
