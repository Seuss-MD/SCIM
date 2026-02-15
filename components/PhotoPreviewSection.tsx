// PhotoPreviewSection.tsx
import { AntDesign, Fontisto } from '@expo/vector-icons';
import { CameraCapturedPicture } from 'expo-camera';
import React from 'react'
import { TouchableOpacity, Image, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { savePhotoToScimFolder } from '@/components/fileSystem';

const PhotoPreviewSection = ({
    photo,
    handleRetakePhoto,
    handleSavePhoto
}: {
    photo: CameraCapturedPicture;
    handleRetakePhoto: () => void;
    handleSavePhoto: () => void;
}) => (
    <SafeAreaView style={styles.container}>
        <View style={styles.box}>
            <Image
                style={styles.previewConatiner}
                source={{uri: photo.uri}}
            />
        </View>

        <View style={styles.buttonContainer}>
            <TouchableOpacity
            style={[styles.button, { backgroundColor: '#ff4d4d' }]}
            onPress={handleRetakePhoto}
            >
                <Fontisto name="trash" size={28} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
            style={[styles.button, { backgroundColor: '#4CAF50' }]}
            onPress={handleSavePhoto}
            >
                <AntDesign name="check" size={32} color="white" />
            </TouchableOpacity>
        </View>
    </SafeAreaView>
);

const styles = StyleSheet.create({
    container:{
        flex: 1,
        backgroundColor: 'black',
        alignItems: 'center',
        justifyContent: 'center',
    },
    box: {
        borderRadius: 15,
        padding: 1,
        height: '85%',
        width: '95%',
        backgroundColor: 'darkgray',
        justifyContent: 'center',
        alignItems: "center",
    },
    previewConatiner: {
        width: '100%',
        height: '100%',
        borderRadius: 15
    },
    buttonContainer: {
        marginTop: 30,
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        width: '100%',
    },

    button: {
        width: 70,
        height: 70,
        borderRadius: 35,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6, // Android shadow
        shadowColor: '#000', // iOS shadow
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },


});

export default PhotoPreviewSection;