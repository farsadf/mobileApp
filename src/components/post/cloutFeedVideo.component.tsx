import React from 'react';
import { StyleSheet, ActivityIndicator } from 'react-native';
import { themeStyles } from '@styles/globalColors';
import WebView from 'react-native-webview';
import { parseVideoLink } from '@services/videoLinkParser';

interface Props {
    embeddedVideoLink: string;
}

export default class CloutFeedVideoComponent extends React.Component<Props> {

    constructor(props: Props) {
        super(props);
    }

    shouldComponentUpdate(nextProps: Props): boolean {
        return nextProps.embeddedVideoLink !== this.props.embeddedVideoLink;
    }

    render(): JSX.Element {
        const parsedVideoLink: string | undefined = this.props.embeddedVideoLink && parseVideoLink(this.props.embeddedVideoLink);

        if (!parsedVideoLink) {
            return <></>;
        }

        const renderLoadingView = () => <ActivityIndicator size='large'
            style={[styles.activityIndicator, themeStyles.containerColorMain]}
            color={themeStyles.fontColorMain.color} />;
        return (
            <WebView
                renderLoading={renderLoadingView}
                startInLoadingState={true}
                scalesPageToFit
                style={[styles.videoContainer, themeStyles.containerColorMain]}
                source={{ uri: parsedVideoLink }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
            />
        );
    }
}

const styles = StyleSheet.create(
    {
        videoContainer: {
            height: 400,
            opacity: 0.99
        },
        activityIndicator: {
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: 0,
            left: 0
        }
    }
);
