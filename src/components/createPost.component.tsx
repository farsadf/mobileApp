import React, { useEffect, useRef, useState } from 'react';
import { Text, View, StyleSheet, Image, InputAccessoryView, Platform, Dimensions, KeyboardAvoidingView, Alert } from 'react-native';
import { ScrollView, TouchableOpacity } from 'react-native-gesture-handler';
import * as Clipboard from 'expo-clipboard';
import { Fontisto, Feather, Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ImageGalleryComponent } from './imageGallery.component';
import { themeStyles } from '@styles';
import { settingsGlobals } from '../globals/settingsGlobals';
import { EventType, Post, Profile } from '@types';
import { PostComponent } from './post/post.component';
import { useNavigation, useRoute } from '@react-navigation/core';
import { ImageInfo } from 'expo-image-picker/build/ImagePicker.types';
import { MentionInput, replaceMentionValues } from 'react-native-controlled-mentions';
import { UserSuggestionList } from './userSuggestionList.component';
import { parseVideoLinkAsync } from '@services/videoLinkParser';
import { CloutTagSuggestionList } from './cloutTagSuggestionList.component';
import CloutFeedVideoComponent from './post/cloutFeedVideo.component';
import { eventManager } from '@globals/injector';
import { wait } from '@services/promiseHelper';
import CloutFeedButton from '@components/cloutfeedButton.component';

export function CreatePostComponent(
    { profile, postText, setPostText, editedPostImageUrls, setImagesBase64, recloutedPost, videoLink, setVideoLink }:
        { profile: Profile, postText: string, setPostText: any, editedPostImageUrls: string[], setImagesBase64: any, recloutedPost?: Post, videoLink: string, setVideoLink: any }
) {
    const navigation = useNavigation();
    const route = useRoute();

    let mount = true;
    const [internalPostText, setInternalPostText] = useState(postText);
    const [imageUrls, setImageUrls] = useState<string[]>(editedPostImageUrls);
    const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
    const [insertVideo, setInsertVideo] = useState<boolean>(!!videoLink);
    const [internalVideoLink, setInternalVideoLink] = useState<string>(videoLink);
    const scrollViewRef = useRef<any>();

    let inputRef: any;

    const inputAccessoryViewId = Platform.OS === 'ios' ? 'inputAccessoryViewID' : undefined;

    useEffect(
        () => {
            return () => {
                mount = false;
            };
        },
        []
    );

    const pickImage = async () => {

        if (imageUrls?.length === 5) {
            alert('You have reached the maximum number of images you can attach per post.');
            return;
        }

        const options = ['Camera', 'Gallery', 'Cancel'];
        const callback = async (p_optionIndex: number) => {
            let result: any;
            switch (p_optionIndex) {
                case 0:
                    if (Platform.OS !== 'web') {
                        const { status } = await ImagePicker.requestCameraPermissionsAsync();
                        if (status !== 'granted') {
                            alert('In order to be able to capture one of your images and attach it to your comment, we need access to your camera.');
                            return;
                        }
                    }

                    await wait(250);
                    result = await ImagePicker.launchCameraAsync(
                        {
                            mediaTypes: ImagePicker.MediaTypeOptions.Images,
                            quality: undefined
                        }
                    );
                    break;
                case 1:
                    if (Platform.OS !== 'web') {
                        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                        if (status !== 'granted') {
                            alert('In order to be able to choose one of your images and attach it to your comment, we need access to your photos.');
                            return;
                        }
                    }

                    await wait(250);
                    result = await ImagePicker.launchImageLibraryAsync(
                        {
                            mediaTypes: ImagePicker.MediaTypeOptions.Images,
                            quality: undefined
                        }
                    );
                    break;
            }
            if (!result.cancelled) {
                if (result.type === 'image') {
                    if (mount) {
                        const uri = (result as ImageInfo).uri;
                        setImageUrls(p_previous => [...p_previous, uri]);
                        setImagesBase64((p_previous: any) => [...p_previous, uri]);
                        setSelectedImageIndex(imageUrls.length);
                    }
                } else {
                    alert('We just support images at the moment.');
                }
            }
        };

        eventManager.dispatchEvent(
            EventType.ToggleActionSheet,
            {
                visible: true,
                config: { options, callback, destructiveButtonIndex: [] }
            }
        );
    };

    function onRemoveImage(p_index: number) {
        setImageUrls(
            (p_previous: any) => {
                const copy = p_previous.slice(0);
                copy.splice(p_index, 1);
                return copy;
            }
        );
        setImagesBase64(
            (p_previous: any) => {
                const copy = p_previous.slice(0);
                copy.splice(p_index, 1);
                return copy;
            }
        );
    }

    async function onPasteVideoLink() {
        const videoLink = await Clipboard.getStringAsync();
        if (!videoLink) {
            Alert.alert('Clipboard is empty!', 'Please make sure you copied the link correctly.');
            return;
        }

        const parsedVideoLink = await parseVideoLinkAsync(videoLink);

        if (parsedVideoLink) {
            if (mount) {
                setInternalVideoLink(parsedVideoLink);
                setVideoLink(parsedVideoLink);
            }

        } else {
            Alert.alert('Error', 'The video link is not valid. We just support YouTube, TikTok, Vimeo, Spotify, SoundCloud and GIPHY links.');
        }
    }

    return <ScrollView
        ref={p_ref => scrollViewRef.current = p_ref}
        bounces={false}
        keyboardShouldPersistTaps={'always'}
        showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
            <Image style={styles.profilePic} source={{ uri: profile.ProfilePic }}></Image>
            <Text style={[styles.username, themeStyles.fontColorMain]}>{profile.Username}</Text>
            {
                profile.IsVerified ?
                    <MaterialIcons name="verified" size={16} color="#007ef5" /> : undefined
            }
        </View>

        <MentionInput
            inputRef={p_ref => { inputRef = p_ref; }}
            style={[styles.textInput, themeStyles.fontColorMain]}
            placeholder="Share your ideas with the world..."
            placeholderTextColor={themeStyles.fontColorSub.color}
            multiline
            maxLength={2048}
            value={internalPostText}
            autoFocus
            inputAccessoryViewID={inputAccessoryViewId}
            onChange={(p_value) => {
                const replaceMention = replaceMentionValues(p_value, ({ name, trigger }) => `${trigger}${name}`);
                setPostText(replaceMention);
                setInternalPostText(p_value);
                inputRef?.focus();
            }}
            keyboardAppearance={settingsGlobals.darkMode ? 'dark' : 'light'}
            partTypes={[
                {
                    trigger: '@',
                    renderSuggestions: UserSuggestionList,
                    isBottomMentionSuggestionsRender: true,
                    isInsertSpaceAfterMention: true,
                    allowedSpacesCount: 0,
                    textStyle: [styles.link, themeStyles.linkColor]
                },
                {
                    trigger: '#',
                    renderSuggestions: CloutTagSuggestionList,
                    isBottomMentionSuggestionsRender: true,
                    isInsertSpaceAfterMention: true,
                    allowedSpacesCount: 0,
                    textStyle: [styles.link, themeStyles.linkColor]
                },
                {
                    trigger: '$',
                    renderSuggestions: UserSuggestionList,
                    isBottomMentionSuggestionsRender: true,
                    isInsertSpaceAfterMention: true,
                    allowedSpacesCount: 0,
                    textStyle: [styles.link, themeStyles.linkColor]
                }
            ]}
        ></MentionInput>
        {
            imageUrls?.length > 0 ?
                <ImageGalleryComponent
                    imageUrls={imageUrls}
                    removable={true}
                    onRemove={onRemoveImage}
                    selectedImageIndex={selectedImageIndex}></ImageGalleryComponent> :
                undefined
        }

        {
            insertVideo && !internalVideoLink ?
                <View style={styles.insertVideoContainer}>
                    <TouchableOpacity style={styles.videoIconTextContainer} onPress={onPasteVideoLink} >
                        <Ionicons name="md-videocam-outline" size={60} color={themeStyles.fontColorMain.color} />
                        <Text style={[styles.insertVideoText, themeStyles.fontColorMain]}>Click here to paste your video URL</Text>
                        <Text style={[styles.insertVideoText, themeStyles.fontColorMain]}>YouTube, TikTok, Vimeo, Spotify, SoundCloud and GIPHY links are supported</Text>
                    </TouchableOpacity>
                    <CloutFeedButton
                        styles={styles.cancelBtn}
                        title={'Cancel'}
                        onPress={() => setInsertVideo(false)}
                    />
                </View>
                : undefined
        }

        {
            insertVideo && internalVideoLink ?
                <View>
                    <View style={styles.removeButtonContainer}>
                        <TouchableOpacity style={styles.removeButton} onPress={() => { setInternalVideoLink(''); setVideoLink(''); setInsertVideo(false); }}>
                            <Fontisto name="close-a" size={14} color="white" />
                        </TouchableOpacity>
                    </View>
                    <CloutFeedVideoComponent embeddedVideoLink={internalVideoLink} />
                </View>
                :
                undefined
        }

        {
            recloutedPost ?
                <View style={[styles.recloutedPostContainer, themeStyles.recloutBorderColor]}>
                    <PostComponent
                        route={route}
                        navigation={navigation}
                        post={recloutedPost}
                        disablePostNavigate={true}
                        disableProfileNavigation={true}
                        actionsDisabled={true}
                        hideBottomBorder={true}></PostComponent>
                </View>
                :
                undefined
        }
        {
            Platform.OS === 'ios' ?
                <InputAccessoryView nativeID={inputAccessoryViewId}>
                    <View style={[styles.inputAccessory, themeStyles.containerColorMain, themeStyles.recloutBorderColor]}>
                        <TouchableOpacity style={styles.inputAccessoryButton} onPress={pickImage}>
                            <Feather name="image" size={20} color={themeStyles.fontColorMain.color} />
                            <Text style={[styles.inputAccessoryButtonText, themeStyles.fontColorMain]}>Image</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.inputAccessoryButton} onPress={() => { setInsertVideo(true); scrollViewRef.current?.scrollToEnd({ animated: true }); }}>
                            <Ionicons name="md-videocam-outline" size={24} color={themeStyles.fontColorMain.color} />
                            <Text style={[styles.inputAccessoryButtonText, themeStyles.fontColorMain]}>Video</Text>
                        </TouchableOpacity>
                    </View>
                </InputAccessoryView>
                :
                <KeyboardAvoidingView
                    behavior={'height'}
                    keyboardVerticalOffset={65}>
                    <View style={[styles.inputAccessory, themeStyles.containerColorMain, themeStyles.recloutBorderColor]}>
                        <TouchableOpacity style={styles.inputAccessoryButton} onPress={pickImage}>
                            <Feather name="image" size={20} color={themeStyles.fontColorMain.color} />
                            <Text style={[styles.inputAccessoryButtonText, themeStyles.fontColorMain]}>Image</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.inputAccessoryButton} onPress={() => setInsertVideo(true)}>
                            <Ionicons name="md-videocam-outline" size={24} color={themeStyles.fontColorMain.color} />
                            <Text style={[styles.inputAccessoryButtonText, themeStyles.fontColorMain]}>Video</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
        }

        <View style={{ height: 500 }}></View>
    </ScrollView>;
}

const styles = StyleSheet.create(
    {
        headerContainer: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            paddingLeft: 10,
            paddingTop: 10
        },
        profilePic: {
            width: 30,
            height: 30,
            borderRadius: 8,
            marginRight: 10
        },
        username: {
            fontWeight: 'bold',
            marginRight: 6,
            maxWidth: Dimensions.get('window').width * 0.6
        },
        textInput: {
            marginRight: 10,
            marginLeft: 10,
            fontSize: 16,
            width: Dimensions.get('window').width - 20,
            minHeight: 40,
            marginTop: 10,
            maxHeight: 150
        },
        inputAccessory: {
            paddingLeft: 16,
            paddingTop: 8,
            paddingBottom: 8,
            borderTopWidth: 1,
            flexDirection: 'row',
            alignItems: 'center'
        },
        inputAccessoryButton: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            marginRight: 16
        },
        inputAccessoryButtonText: {
            marginLeft: 6
        },
        insertVideoContainer: {
            height: 200,
            width: '75%',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 'auto',
            marginRight: 'auto'
        },
        videoIconTextContainer: {
            alignItems: 'center'
        },
        insertVideoText: {
            textAlign: 'center'
        },
        cancelBtn: {
            marginTop: 10
        },
        recloutedPostContainer: {
            marginLeft: 10,
            marginRight: 10,
            borderWidth: 1,
            padding: 10,
            paddingBottom: 4,
            borderRadius: 8,
            marginTop: 10
        },
        videoContainer: {
            height: 400,
            width: '100%'
        },
        removeButtonContainer: {
            backgroundColor: '#c42326',
            width: 30,
            height: 30,
            zIndex: 10,
            position: 'absolute',
            top: 10,
            right: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            opacity: 0.8
        },
        removeButton: {
            width: 30,
            height: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        },
        link: {
            fontWeight: '500'
        }
    }
);
