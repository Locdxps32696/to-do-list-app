import {
  Add,
  Edit2,
  Element4,
  Logout,
  Notification,
  SearchNormal1,
  TickCircle,
} from 'iconsax-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Task, TouchableOpacity, View } from 'react-native';
import AvatarGroup from '../../components/AvatarGroup';
import CardComponent from '../../components/CardComponent';
import CardImageConponent from '../../components/CardImageConponent';
import CicularComponent from '../../components/CicularComponent';
import Container from '../../components/Container';
import ProgressBarComponent from '../../components/ProgressBarComponent';
import RowComponent from '../../components/RowComponent';
import SectionComponent from '../../components/SectionComponent';
import SpaceComponent from '../../components/SpaceComponent';
import TagComponent from '../../components/TagComponent';
import TextComponent from '../../components/TextComponent';
import TitleComponent from '../../components/TitleComponent';
import { colors } from '../../constants/colors';
import { fontFamilies } from '../../constants/fontFamilies';
import { globalStyles } from '../../styles/globalStyles';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { TaskModel } from '../../models/TaskModel';
import ListTaskComponent from '../../components/ListTaskComponent';
import { HandleDateTime } from '../../utils/HandleDateTime';
import ItemTask from '../../components/ItemTask';
import { handleNotification } from '../../utils/handleNotification';

const HomeScreen = ({ navigation }: any) => {
  const user = auth().currentUser
  const handleSingout = async () => {
    await auth().signOut();
  };

  const [isLoading, setisLoading] = useState(false);
  const [dataTask, setdataTask] = useState<TaskModel[]>([]);
  const [listDoNot, setlistDoNot] = useState<TaskModel[]>([]);
  const [listDoing, setlistDoing] = useState<TaskModel[]>([]);
  const [listDone, setlistDone] = useState<TaskModel[]>([]);
  const [taskDoneToday, settaskDoneToday] = useState<TaskModel[]>([]);
  const [fullTaskToday, setFullTaskToday] = useState<TaskModel[]>([]);

  const today = Date.now()
  const date = new Date(today)

  const getNewTasks = async () => {
    setisLoading(true)
    firestore().collection('Tasks')
      .where('uids', 'array-contains', user?.uid)
      .onSnapshot(snap => {
        setisLoading(false);
        // if (snap !== null) {
        if (snap.empty) {
          console.log('Tasks not found');
          setdataTask([])
        } else {
          // snap.query.orderBy('dueDate', 'asc')
          const items: TaskModel[] = [];
          snap.forEach((item: any) => {
            items.push({
              id: item.id,
              ...item.data()
            })
          }
          );
          setdataTask(items.reverse());
        }
      })
  }

  useEffect(() => {
    getNewTasks()
    handleNotification.checkNotificationPermission()
  }, []);

  const compareDate = (date1: Date, date2: Date): boolean => {
    const stringDate1 = date1.toISOString().split('T')[0];
    const stringDate2 = date2.toISOString().split('T')[0];
    return stringDate1 === stringDate2;
  };

  useEffect(() => {
    if (dataTask.length > 0) {
      setlistDoNot(dataTask.filter((item) => item.progress === 0))
      setlistDoing(dataTask.filter((item) => item.progress > 0 && item.progress < 1))
      setlistDone(dataTask.filter((item) => item.progress === 1))     
    }
  }, [dataTask]);


  return (
    <View style={{ flex: 1 }}>
      <Container isScroll styles={{ marginBottom: 60 }}>
        <SectionComponent>
          <RowComponent justify="space-between">
            <Element4 size={24} color={colors.desc} />
            <Notification size={24} color={colors.desc} />
          </RowComponent>
        </SectionComponent>
        <SectionComponent>
          <RowComponent>
            <View
              style={{
                flex: 1,
              }}>
              <TextComponent text={`Hi, ${user?.email}`} />
              <TitleComponent text="Be Productive today" />
            </View>
            <TouchableOpacity onPress={handleSingout}>
              <Logout size={22} color="coral" />
            </TouchableOpacity>
          </RowComponent>
        </SectionComponent>
        <SectionComponent>
          <RowComponent
            styles={[globalStyles.inputContainer, { justifyContent: 'space-between' }]}
            onPress={() => navigation.navigate('SearchScreen', {listTask: dataTask})}>
            <TextComponent color="#696B6F" text="Search task" />
            <SearchNormal1 size={20} color={colors.desc} />
          </RowComponent>
        </SectionComponent>

        <SectionComponent>
          <CardComponent>
            <RowComponent>
              <View style={{ flex: 1 }}>
                <TitleComponent text="Task progress" />
                <TextComponent text={`${listDone.length}/${dataTask.length} tasks done`} />
                <SpaceComponent height={12} />
                <RowComponent justify="flex-start">
                  <TagComponent
                    text={HandleDateTime.MonthString(today)}
                    onPress={() => console.log('Say Hi!!!')}
                  />
                </RowComponent>
              </View>
              <View>
                <CicularComponent value={(listDone.length / dataTask.length) * 100} />
              </View>
            </RowComponent>
          </CardComponent>
        </SectionComponent>


        {
          isLoading
            ? <ActivityIndicator />
            : dataTask.length > 0
              ? <SectionComponent>
                <View style={[globalStyles.listTaskStyle]}>
                  <RowComponent justify='space-between'>
                    <TitleComponent text='Tasks not done yet' />
                    <TitleComponent text={`${listDoNot.length} Tasks`} />
                  </RowComponent>
                  <SpaceComponent height={10} />
                  <ListTaskComponent listTasks={listDoNot} navigation={navigation} />
                  {
                    listDoNot.length > 4 &&
                    <RowComponent justify='flex-start' onPress={() => {
                      navigation.navigate('ListFullTask', { listTask: listDoNot, title: 'Tasks not done yet' })
                    }}>
                      <TextComponent text='See more...' size={16} color={colors.blue} font={fontFamilies.semiBold} />
                    </RowComponent>
                  }
                </View>

                <SpaceComponent height={10} />

                <View style={[globalStyles.listTaskStyle]}>
                  <RowComponent justify='space-between'>
                    <TitleComponent text='Tasks doing' />
                    <TitleComponent text={`${listDoing.length} Tasks`} />
                  </RowComponent>
                  <SpaceComponent height={10} />
                  <ListTaskComponent listTasks={listDoing} navigation={navigation} />
                  {
                    listDoing.length > 4 &&
                    <RowComponent justify='flex-start'
                      onPress={() => {
                        navigation.navigate('ListFullTask', { listTask: listDoing, title: 'Tasks doing' })
                      }}>
                      <TextComponent text='See more...' size={16} color={colors.blue} font={fontFamilies.semiBold} />
                    </RowComponent>
                  }
                </View>

                <SpaceComponent height={10} />

                <View style={[globalStyles.listTaskStyle]}>
                  <RowComponent justify='space-between'>
                    <TitleComponent text='Tasks done' />
                    <TitleComponent text={`${listDone.length} Tasks`} />
                  </RowComponent>
                  <SpaceComponent height={10} />
                  <ListTaskComponent listTasks={listDone} navigation={navigation} />
                  {
                    listDone.length > 4 &&
                    <RowComponent justify='flex-start'
                      onPress={() => {
                        navigation.navigate('ListFullTask', { listTask: listDone, title: 'Tasks done' })
                      }}>
                      <TextComponent text='See more...' size={16} color={colors.blue} font={fontFamilies.semiBold} />
                    </RowComponent>
                  }
                </View>
              </SectionComponent>
              : <></>
        }

      </Container>

      <View
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          left: 0,
          padding: 20,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => navigation.navigate('AddNewTask', { Id_user: user?.uid, editAble: true, isAdd: true })}
          style={[
            globalStyles.row,
            {
              backgroundColor: colors.blue,
              padding: 10,
              borderRadius: 12,
              paddingVertical: 14,
              width: '80%',
            },
          ]}>
          <TextComponent text="Add new tasks" flex={0} />
          <Add size={22} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default HomeScreen;
