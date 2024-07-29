import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import Container from '../../components/Container'
import SectionComponent from '../../components/SectionComponent'
import TextComponent from '../../components/TextComponent'
import { colors } from '../../constants/colors'
import RowComponent from '../../components/RowComponent'
import { Additem, AddSquare, ArrowLeft2, CalendarEdit, Clock, Task, TickCircle } from 'iconsax-react-native'
import firestore from '@react-native-firebase/firestore';
import { Attachment, SubTask, TaskModel } from '../../models/TaskModel'
import TitleComponent from '../../components/TitleComponent'
import SpaceComponent from '../../components/SpaceComponent'
import { fontFamilies } from '../../constants/fontFamilies'
import AvatarGroup from '../../components/AvatarGroup'
import { HandleDateTime } from '../../utils/HandleDateTime'
import CardComponent from '../../components/CardComponent'
import CardImageConponent from '../../components/CardImageConponent'
import { Slider } from '@miblanchard/react-native-slider'
import ButtonComponent from '../../components/ButtonComponent'
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import DropDownPicker from '../../components/DropDownPicker'
import { SelectModel } from '../../models/SelectModel'
import UploadFileComponent from '../../components/UploadFileComponent'
import { CalcFileSize } from '../../utils/CalcFileSize'
import ListFileComponent from '../../components/ListFileComponent'
import SubTaskComponent from '../../components/SubTaskComponent'

const TaskDetailSreen = ({ navigation, route }: any) => {
    const { id, color }: { id: string, color?: string } = route.params

    const [TaskDetail, setTaskDetail] = useState<TaskModel>();
    const [Progress, setProgress] = useState<number>(0);
    const [isUpdate, setisUpdate] = useState(false);
    const [subTask, setsubTask] = useState<any[]>([]);
    const [usersSelected, setusersSelected] = useState<SelectModel[]>([]);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [listSubTasks, setListSubTasks] = useState<SubTask[]>([]);

    const bottomSheet = useRef<BottomSheet>(null)

    useEffect(() => {
        handleGetTaskDetail()
        handleGetAllSubTaskById()
    }, []);

    useEffect(() => {
        if (TaskDetail?.progress === undefined) {
            setisUpdate(false)
        } else {
            if (Progress !== TaskDetail?.progress
                || attachments !== TaskDetail.attachments
            ) {
                // console.log('progress::', TaskDetail?.progress)
                setisUpdate(true)
            } else {
                setisUpdate(false)
            }
        }
    }, [Progress, attachments]);

    useEffect(() => {
        if (TaskDetail) {
            setProgress(TaskDetail.progress ?? 0)
            setAttachments(TaskDetail.attachments)
            setisUpdate(true)
        }
    }, [TaskDetail]);

    useEffect(() => { handleGetAllUsers() }, [])

    useEffect(() => {
        if (listSubTasks.length > 0) {
            const completedPercent =
                listSubTasks.filter(element => element.isCompleted).length /
                listSubTasks.length
            setProgress(completedPercent)
        }
    }, [listSubTasks]);

    const handleGetAllSubTaskById = () => {
        firestore().collection('SubTasks').where('idTask', '==', id).onSnapshot((snap) => {
            if (snap.empty) {
                console.log('Data SubTask Not Found')
            } else {
                const items: any[] = []
                snap.forEach((item: any) => {
                    items.push({
                        ...item.data(),
                        id: item?.id,
                        idTask: id,
                    })
                })
                setListSubTasks(items)
            }
        })
    }

    const handleGetTaskDetail = () => {
        firestore().doc(`Tasks/${id}`).onSnapshot((snap: any) => {
            if (snap.exists) {
                setTaskDetail({
                    id,
                    ...snap.data()
                })
            } else {
                console.log('Task detail not found!');
            }
        })
    }

    const handleUpdateTask = async () => {
        const data = { ...TaskDetail, progress: Progress, attachments, updateAt: Date.now() }

        await firestore().doc(`Tasks/${id}`).update(data).then(() => {
            bottomSheet.current?.expand()
        }).catch((error: any) => console.log('handleUpdateTask Error::', error))
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

    return (TaskDetail ?
        <>
            <ScrollView style={{ flex: 1, backgroundColor: colors.bgColor }}>
                <CardImageConponent
                    styles={{
                        backgroundColor: color ?? colors.bgColor,
                        paddingVertical: 20,
                        borderBottomEndRadius: 15,
                        borderBottomStartRadius: 15,
                        borderTopLeftRadius: 0,
                        borderTopRightRadius: 0
                    }}
                >
                    <RowComponent justify='space-between'>
                        <TouchableOpacity onPress={() => {
                            handleUpdateTask()
                            navigation.goBack()}}>
                            <ArrowLeft2 size={24} color={colors.text} />
                        </TouchableOpacity>
                        <TitleComponent size={24} line={1} text={TaskDetail.title} flex={1} font={fontFamilies.bold} />
                        <SpaceComponent width={24} />
                    </RowComponent>

                    <SpaceComponent height={17} />
                    <TextComponent text='Due date' />

                    <RowComponent styles={{ marginTop: 10 }}>
                        <RowComponent styles={{ flex: 1, marginRight: 12 }} justify='flex-start'>
                            <Clock size={18} color={colors.white} />
                            <SpaceComponent width={8} />
                            <TextComponent text={`${HandleDateTime.GetHour(TaskDetail.start?.toDate())} - ${HandleDateTime.GetHour(TaskDetail.end?.toDate())}`} />
                        </RowComponent>

                        <RowComponent styles={{ flex: 1 }} justify='flex-start'>
                            <CalendarEdit size={18} color={colors.white} />
                            <SpaceComponent width={8} />
                            <TextComponent text={`${HandleDateTime.DateString(TaskDetail.dueDate.toDate())}`} />
                        </RowComponent>

                        <RowComponent styles={{ flex: 1 }} justify='flex-end'>
                            <AvatarGroup uids={TaskDetail.uids} />
                        </RowComponent>
                    </RowComponent>
                </CardImageConponent>

                <SpaceComponent height={10} />

                <SectionComponent>
                    <TitleComponent text='Description' size={20} />
                    <CardComponent styles={{
                        backgroundColor: colors.bgColor,
                        borderRadius: 15,
                        borderColor: colors.gray2,
                        borderWidth: 1,
                        marginTop: 10
                    }}>
                        <TextComponent text={TaskDetail.desctiption} styles={{ textAlign: 'justify' }} />
                    </CardComponent>
                </SectionComponent>

                <SectionComponent>
                    <DropDownPicker
                        title='Members'
                        selected={TaskDetail.uids}
                        items={usersSelected}
                        onSelect={val => {
                            setTaskDetail({ ...TaskDetail, uids: val })
                        }}
                        multible
                        size={20}
                        font={fontFamilies.semiBold}
                    />
                </SectionComponent>

                <SectionComponent>
                    <RowComponent justify='space-between'>
                        <TitleComponent text='Files & Links' flex={1} font={fontFamilies.semiBold} />
                    </RowComponent>
                    <SpaceComponent height={7} />
                    <ListFileComponent
                        list={attachments}
                        onChange={(list) => { setAttachments([...list]) }} />
                </SectionComponent>


                <SectionComponent>
                    <RowComponent justify='flex-start'>
                        <View style={{
                            width: 20,
                            height: 20,
                            borderRadius: 100,
                            borderColor: Progress === 0 ? colors.white : color ?? colors.success,
                            borderWidth: 2,
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: 10
                        }}><View style={{
                            backgroundColor: Progress === 0 ? colors.white : color ?? colors.success,
                            width: 15,
                            height: 15,
                            borderRadius: 100,
                        }} />
                        </View>
                        <SpaceComponent width={5} />
                        <TitleComponent flex={1} text='Progress' />
                    </RowComponent>

                    <RowComponent justify='space-between' >
                        <View style={{ flex: 1 }}>
                            <Slider
                                disabled={listSubTasks.length > 0 ? true : false}
                                value={Progress}
                                onValueChange={val => { setProgress(val[0]) }}
                                thumbTintColor={Progress === 0 ? colors.white : color ?? colors.success}
                                maximumTrackTintColor={colors.gray2}
                                minimumTrackTintColor={color ?? colors.success}
                                trackStyle={{ height: 10, borderRadius: 100 }}
                                thumbStyle={{ borderWidth: 2, borderColor: colors.white }} />
                        </View>
                        <SpaceComponent width={20} />
                        <TextComponent
                            text={`${Math.floor(Progress * 100)} %`}
                            font={fontFamilies.bold}
                            size={18} />
                    </RowComponent>
                </SectionComponent>

                <SectionComponent>
                    <SubTaskComponent
                        listSubTask={listSubTasks}
                        onSave={list => setListSubTasks(list)}
                        isUpdate={true}
                        idTask={id}
                    />
                </SectionComponent>

                <SpaceComponent height={60} />

            </ScrollView>

            {
                // isUpdate &&
                <View style={{
                    position: 'absolute',
                    bottom: 20,
                    width: '100%',
                    paddingHorizontal: 20
                }}>
                    <ButtonComponent
                        text='Update'
                        onPress={() => { handleUpdateTask() }}
                        style={{ backgroundColor: color ?? colors.success }}
                        font={fontFamilies.bold} />
                </View>
            }


            <BottomSheet ref={bottomSheet}
                snapPoints={[150, 150]}
                enablePanDownToClose={true}
                index={-1}>
                <BottomSheetView style={{ alignContent: 'space-between', paddingHorizontal: 20 }}>
                    <TextComponent
                        text='UPDATE TASK SUCCESS!'
                        color={color ?? colors.desc}
                        font={fontFamilies.bold}
                        size={20}
                        styles={{ textAlign: 'center' }}
                    />
                    <SpaceComponent height={20} />
                    <ButtonComponent
                        text='Ok'
                        color={color ?? colors.desc}
                        colorText='white' onPress={() => {
                            bottomSheet.current?.close()
                            navigation.goBack()
                        }}
                        font={fontFamilies.bold} />
                </BottomSheetView>
            </BottomSheet>
        </>
        : <></>
    )
}

export default TaskDetailSreen