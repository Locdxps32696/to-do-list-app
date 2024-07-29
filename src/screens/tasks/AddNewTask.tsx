import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Alert, Button, Dimensions, Linking, PermissionsAndroid, ScrollView, Task, View } from 'react-native';
import Container from '../../components/Container';
import DateTimePickerComponent from '../../components/DateTimePickerComponent';
import InputComponent from '../../components/InputComponent';
import RowComponent from '../../components/RowComponent';
import SectionComponent from '../../components/SectionComponent';
import SpaceComponent from '../../components/SpaceComponent';
import { Attachment, SubTask, TaskModel } from '../../models/TaskModel';
import ButtonComponent from '../../components/ButtonComponent';
import { colors } from '../../constants/colors';
import { fontFamilies } from '../../constants/fontFamilies';
import DropDownPicker from '../../components/DropDownPicker';
import { SelectModel } from '../../models/SelectModel';
import firestore from '@react-native-firebase/firestore';
import { err } from 'react-native-svg';
import TitleComponent from '../../components/TitleComponent';
import { AttachSquare } from 'iconsax-react-native';
import DocumentPicker, { DocumentPickerOptions, DocumentPickerResponse } from 'react-native-document-picker';
import TextComponent from '../../components/TextComponent';
import storage from '@react-native-firebase/storage'
import { utils } from '@react-native-firebase/app';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import UploadFileComponent from '../../components/UploadFileComponent';
import { CalcFileSize, getRandomColorRGBA } from '../../utils/CalcFileSize';
import ListFileComponent from '../../components/ListFileComponent';
import SubTaskComponent from '../../components/SubTaskComponent';
import { HandleDateTime } from '../../utils/HandleDateTime';
import { handleNotification } from '../../utils/handleNotification';

const initValue: TaskModel = {
  title: '',
  desctiption: '',
  dueDate: new Date(),
  start: new Date(),
  end: new Date(),
  uids: [],
  attachments: [],
  progress: 0
};

const AddNewTask = ({ navigation, route }: any) => {
  const { Id_user, editAble, task, isAdd }: { Id_user: string, editAble?: boolean, task?: TaskModel, isAdd?: boolean } = route.params
  const [taskDetail, setTaskDetail] = useState<TaskModel>(initValue);
  const [usersSelected, setusersSelected] = useState<SelectModel[]>([]);
  const [isLoading, setisLoading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [listSubTask, setlistSubTask] = useState<SubTask[]>([]);
  const [idTask, setIdTask] = useState<string>('');
  const [Progress, setProgress] = useState<number>(0);

  const bottomSheet = useRef<BottomSheet>(null)

  useEffect(() => {
    let completedPercent
    const SubTaskDone = listSubTask.filter(element => element.isCompleted).length
    const lengthSubTask = listSubTask.length
    if (lengthSubTask === 0) {
      setProgress(0)
    } else {
      completedPercent = SubTaskDone / lengthSubTask
      setProgress(completedPercent)
    }
    console.log('progress::', Progress)
  }, [listSubTask]);

  useEffect(() => { handleGetAllUsers() }, [])

  useEffect(() => {
    if (idTask !== '') {
      listSubTask.forEach((item, index) => {
        const data = {
          ...item,
          idTask: idTask
        }
        handleAddSubTask(data)
      })
    }
  }, [idTask]);



  useEffect(() => {
    if (task) {
      setTaskDetail({
        title: task.title,
        desctiption: task.desctiption,
        start: HandleDateTime.GetHourDate(Number(task.start)),
        end: HandleDateTime.GetHourDate(Number(task.end)),
        dueDate: HandleDateTime.GetHourDate(Number(task.dueDate)),
        attachments: task.attachments,
        progress: task.progress,
        uids: task?.uids
      })
      // console.log('uids::',task?.uids)
      firestore().collection('SubTasks')
        .where('idTask', '==', task?.id)
        .onSnapshot((snap) => {
          if (snap.empty) {
            console.log('SubTask not found')
          } else {
            const list: any = []
            snap.forEach((item) => {
              list.push({
                id: item.id,
                ...item.data()
              })
            })
            setlistSubTask(list)
          }
        })
    } else {
      setTaskDetail({ ...taskDetail, uids: [Id_user] })
    }
  }, [task, Id_user]);

  const handleAddSubTask = async (data: any) => {
    await firestore().collection('SubTasks').add(data).then(() => {
      // bottomSheet.current?.expand()
    }).catch(error => console.log('handleAddSubTask Error::', error))
  }



  const handleGetAllUsers = async () => {
    await firestore().collection('Users').get().then(snap => {
      if (snap.empty) {
        console.log(`Users data not found`);
      } else {
        const items: SelectModel[] = []
        snap.forEach(item => {
          items.push({
            label: item.data().email,
            value: item.id
          })
        })
        setusersSelected(items)
      }
    }).catch((error: any) => console.log(`Can not get users ${error.message}`))
  }

  const handleChangeValue = (key: string, value: string | Date | string[]) => {
    const item: any = { ...taskDetail };

    item[`${key}`] = value;

    setTaskDetail(item);
  };

  const handleDeleteTask = () => {
    if (task) {
      Alert.alert('Comfirm', 'Are you sure, you want delete task?', [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => console.log('Cancel')
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await firestore().doc(`Tasks/${task.id}`).delete().then(() => {
              navigation.goBack()
            }).catch(error => console.log(error))
          }
        }
      ])
    }
  }



  const handleAddNewTask = async () => {
    const data = { ...taskDetail, attachments }

    if (task) {
      const dataUpdate = {
        ...data,
        progress: Progress,
        updateAt: Date.now()
      }
      await firestore().doc(`Tasks/${task.id}`).update(dataUpdate).then(() => {
        console.log('Update Task Success')
        bottomSheet.current?.expand()
      }).catch(error => console.log('Update Task Error::', error))
    } else {
      const dataAdd = {
        ...data,
        progress: 0,
        createAt: Date.now(),
        color: getRandomColorRGBA()
      }

      if (dataAdd.uids.length > 0) {
        await firestore().collection('Tasks')
          .add(dataAdd)
          .then((metadata) => {
            setIdTask(metadata.id)
            dataAdd.uids.forEach(member => member !== Id_user && handleNotification.SendNotification({
              memberId: member,
              title: '',
              body: '',
              taskId: ''
            }))
            bottomSheet.current?.expand()
          }).catch(error => console.log('handleAddNewTask Error::', error))
      }

    }
  };



  return (
    <>
      <Container back title={isAdd ? 'ADD NEW TASK' : 'EDIT TASK'} isScroll styles={{ paddingBottom: 60 }}>
        <SectionComponent>
          <InputComponent
            value={taskDetail.title}
            onChange={val => handleChangeValue('title', val)}
            title="Title"
            allowClear
            placeholder="Title of task"
            height={20}
          />
          <InputComponent
            value={taskDetail.desctiption}
            onChange={val => handleChangeValue('desctiption', val)}
            title="Description"
            allowClear
            placeholder="Content"
            multible
            numberOfLine={3}
          />

          <DateTimePickerComponent
            selected={taskDetail.dueDate}
            onSelect={val => handleChangeValue('dueDate', val)}
            placeholder="Choice"
            type="date"
            title="Due date"
          />

          <RowComponent>
            <View style={{ flex: 1 }}>
              <DateTimePickerComponent
                selected={taskDetail.start}
                type="time"
                onSelect={val => handleChangeValue('start', val)}
                title="Start"
              />
            </View>
            <SpaceComponent width={14} />
            <View style={{ flex: 1 }}>
              <DateTimePickerComponent
                selected={taskDetail.end}
                onSelect={val => handleChangeValue('end', val)}
                title="End"
                type="time"
              />
            </View>
          </RowComponent>

          <DropDownPicker
            title='Members'
            selected={taskDetail.uids}
            items={usersSelected}
            onSelect={val => {
              console.log('uids::', val)
              handleChangeValue('uids', val)
            }}
            multible
            isEdit={editAble}
          />

          <SpaceComponent height={10} />

          <View>
            <RowComponent justify='flex-start' >
              <TitleComponent text='Attachments' flex={0} size={16} />
              <SpaceComponent width={8} />
              <UploadFileComponent onUpload={file => file && setAttachments([...attachments, file])} />
            </RowComponent>
            <SpaceComponent height={7} />
            <ListFileComponent
              list={attachments}
              onChange={list => setAttachments([...list])}
              isEdit={editAble}
            />
          </View>

          <SpaceComponent height={10} />
          <SubTaskComponent
            listSubTask={listSubTask}
            isUpdate={editAble ? true : false}
            onSave={(list) => {
              setlistSubTask(list)
            }}
            isEdit={editAble}
            idTask={editAble ? task?.id : idTask}
            isAdd={isAdd}
          />

        </SectionComponent>

      </Container>

      <RowComponent styles={{ position: 'absolute', bottom: 15, paddingHorizontal: 20 }}>
        {
          !isAdd &&
          <ButtonComponent
            text={'Delete'}
            onPress={handleDeleteTask}
            colorText='red'
            padding={12}
            font={fontFamilies.bold}
            style={{
              backgroundColor: colors.bgColor,
              borderColor: 'red',
              flex: 1,
              borderWidth: 1
            }}
          />
        }
        {
          !isAdd && <SpaceComponent width={10} />
        }
        <ButtonComponent
          text={!isAdd ? 'Edit' : 'Add'}
          onPress={handleAddNewTask}
          color={colors.blue}
          padding={12}
          font={fontFamilies.bold}
          style={{ flex: !isAdd ? 1 : 0 }}
        />
      </RowComponent>

      <BottomSheet ref={bottomSheet} snapPoints={[150, 150]} enablePanDownToClose={true} index={-1}>
        <BottomSheetView style={{ alignContent: 'space-between', paddingHorizontal: 20 }}>
          <TextComponent
            text={!isAdd ? 'UPDATE TASK SUCCESS!' : 'ADD NEW TASK SUCCESS!'}
            color='black'
            font={fontFamilies.bold}
            size={20}
            styles={{ textAlign: 'center' }}
          />
          <SpaceComponent height={20} />
          <ButtonComponent text='Ok' color='black' colorText='white' onPress={() => {
            bottomSheet.current?.close()
            navigation.goBack()
          }} />
        </BottomSheetView>
      </BottomSheet>
    </>
  );
};

export default AddNewTask;
