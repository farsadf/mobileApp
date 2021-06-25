import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { CreatorsSearchScreen } from '@screens/search/creatorSearch.screen';
import CloutTagSearchScreen from '@screens/search/cloutTagSearch.screen';
import { NavigationProp } from '@react-navigation/native';
import TopTabBarComponent from '@components/TopTabBar.component';

interface Props {
    navigation: NavigationProp<any>;
}

const TopTab = createMaterialTopTabNavigator();

export default class SearchTabNavigator extends React.Component<Props> {

    private _unsubscribeNavigationEvent: any;

    constructor(props: Props) {
        super(props);
    }

    render() {
        return (
            <TopTab.Navigator
                tabBar={props => <TopTabBarComponent {...props} />}
            >
                <TopTab.Screen name="Creators" children={props => <CreatorsSearchScreen {...props} />} />
                <TopTab.Screen name="CloutTags" children={props => <CloutTagSearchScreen {...props} />} />
            </TopTab.Navigator>
        )
    }
}
