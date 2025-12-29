/*
  * Copyright (c) 2025 Huawei Device Co., Ltd.
  *
  * Licensed under the Apache License, Version 2.0 (the "License");
  * you may not use this file except in compliance with the License.
  * You may obtain a copy of the License at
    *
  * http://www.apache.org/licenses/LICENSE-2.0
    *
  * Unless required by applicable law or agreed to in writing, software
  * distributed under the License is distributed on an "AS IS" BASIS,
  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  * See the License for the specific language governing permissions and
  * limitations under the License.
  */

import {
  GlobalContext,
  DaoMaster,
  TableAction,
  Property,
  BaseDao,
  DaoSession,
  Query,
  OnTableChangedListener,
  QueryBuilder
} from '@ohos/dataorm';
import { Note } from './Note'
import { NoteType } from './NoteType'
import dataRdb from '@ohos.data.relationalStore';
import { LogUtil } from '../utils/LogUtil';


@Entry
@Component
struct Index {
  private daoSession: DaoSession | null = null;
  private noteDao: BaseDao<Note, number> | null = null;
  private notesQuery: Query<Note> | null = null;
  @State noteList: Note[] = [];
  note1?: Note;
  note2?: Note;
  note3?: Note;
  note4?: Note;
  noteInsertOne?: Note;
  @State selectedNote: Note | null = null;

  async aboutToAppear() {
    this.daoSession = GlobalContext.getContext().getValue("daoSession") as DaoSession;
    this.noteDao = this.daoSession?.getBaseDao(Note) ?? null;
    if (!this.noteDao) {
      return;
    }
    // 添加监听
    this.noteDao.addTableChangedListener(this.tabListener());
    let entityClass = GlobalContext.getContext().getValue(GlobalContext.KEY_CLS) as Record<string, Object>;
    let properties = entityClass.Note as Record<string, Property>;
    this.notesQuery = this.noteDao.queryBuilder().orderAsc(properties.text).build();
  }

  tabListener(): OnTableChangedListener<dataRdb.ResultSet> {
    let that = this;
    return {
      async onTableChanged(t: dataRdb.ResultSet, action: TableAction) {
        if (action === TableAction.INSERT) {
          that.refreshList();
        } else if (action === TableAction.UPDATE) {
          that.refreshList();
        } else if (action === TableAction.DELETE) {
          that.refreshList();
        } else if (action === TableAction.QUERY) {
        }
      }
    }
  }

  refreshList() {
    if (this.notesQuery) {
      // 查询所有数据并刷新界面
      this.noteList = this.notesQuery.listSync() ?? [];
    }
  }

  insertOneSync() {
    if (!this.noteDao) {
      return;
    }
    if (this.noteInsertOne) {
      this.noteInsertOne = new Note();
      this.noteInsertOne.setText('Add One Item');
      this.noteInsertOne.setComment('comment');
      this.noteInsertOne.setType(NoteType[NoteType.TEXT]);
      this.noteDao.insertOrReplaceSync(this.noteInsertOne);
    } else {
      let note = new Note();
      note.setText('Add One Item');
      note.setComment('comment');
      note.setType(NoteType[NoteType.TEXT]);
      this.noteDao.insertOrReplaceSync(note);
    }

  }

  insertBatchSync() {
    if (!this.noteDao) {
      return;
    }
    let noteArr: Note[] = [];
    for (let i = 1; i <= 6; i++) {
      noteArr.push(new Note(undefined, `batch ${i}`, `insertBatchSync ${i}`, '', NoteType[NoteType.TEXT]));
    }
    this.noteDao.insertOrReplaceInTxSync(noteArr);
  }

  list() {
    this.refreshList();
  }

  // 删除首条
  deleteFirstOne() {
    if (!this.noteDao) {
      return;
    }
    // 直接查数据库获取最新数据
    let notes = this.notesQuery?.listSync() ?? [];
    if (!notes || notes.length === 0) {
      return;
    }
    let firstNote = notes[0];
    this.noteDao.deleteSync(firstNote);
  }

  // 批量删除
  deleteBatch() {
    if (!this.noteDao) {
      return;
    }
    let notes = this.notesQuery?.listSync() ?? [];
    if (!notes || notes.length === 0) {
      return;
    }
    this.noteDao.deleteInTxArrSync(...notes);
  }

  // 按Key删除首条
  deleteByKey() {
    if (!this.noteDao) {
      return;
    }
    let notes = this.notesQuery?.listSync() ?? []
    if (!notes || notes.length === 0) {
      return;
    }
    let firstNote = notes[0];
    this.noteDao.deleteByKeySync(firstNote.getId());
  }

  // 按Keys批量删除
  deleteByKeys() {
    if (!this.noteDao) {
      return;
    }
    let notes = this.notesQuery?.listSync() ?? []
    if (!notes || notes.length === 0) {
      return;
    }
    let ids = notes.map(note => note.getId());
    this.noteDao.deleteByKeyInTxArrSync(...ids);
  }

  // 更新首条
  updateFirstOne() {
    if (!this.noteDao) {
      return;
    }
    let notes = this.notesQuery?.listSync() ?? []
    if (!notes || notes.length === 0) {
      return;
    }
    let firstNote = notes[0];
    firstNote.setText(`已更新-${firstNote.text}`);
    firstNote.setComment(`已更新-${firstNote.comment}`);
    this.noteDao.updateSync(firstNote);
  }

  // 加载首条
  load() {
    if (!this.noteDao) {
      return;
    }
    let notes = this.notesQuery?.listSync() ?? []
    if (!notes || notes.length === 0) {
      return;
    }
    let firstId = notes[0].getId();
    let note = this.noteDao.loadSync(firstId);
    this.selectedNote = note;
  }

  loadAll() {
    if (!this.noteDao) {
      return;
    }
    let notes = this.noteDao.loadAllSync();
    this.noteList = notes ?? [];
  }

  saveInTxSync() {
    if (!this.noteDao) {
      return;
    }
    let currentNotes = this.notesQuery?.listSync() ?? []

    // add
    let noteOne = new Note()
    noteOne.setText('abc1')
    noteOne.setComment('saveInTxSync comment')
    noteOne.setType(NoteType[NoteType.TEXT])

    //update
    let noteTwo = new Note()
    noteTwo.setId(currentNotes[0]?.id)
    noteTwo.setText('abc2')
    noteTwo.setComment('saveInTxSync comment')
    noteTwo.setType(NoteType[NoteType.TEXT])


    let entities: Set<Note> = new Set<Note>()
    entities.add(noteOne).add(noteTwo)
    this.noteDao.saveInTxASync(noteOne, noteTwo)
    // this.noteDao.saveInTxSync(entities)
  }

  deleteByKeyInTxIterableAsync() {
    if (!this.noteDao) {
      return;
    }
    this.noteDao.deleteByKeyInTxIterableSync([2])
    this.list()
  }

  deleteInTxIterableSyncTest() {
    if (!this.noteDao) {
      return;
    }
    try {
      let notes = this.notesQuery?.listSync() ?? []
      if (!notes || notes.length === 0) {
        return;
      }
      const targetIds = [1, 3, 5];
      const notesToDelete = notes.filter(note => targetIds.includes(note.id));
      if (notesToDelete.length === 0) {
        return;
      }
      this.noteDao.deleteInTxIterableSync(notesToDelete);
      this.list();
    } catch (error) {
      LogUtil.error('deleteInTxIterableSync测试失败:', error);
    }
  }

  updateInTxSyncTest() {
    if (!this.noteDao) {
      return;
    }
    try {
      let notes = this.notesQuery?.listSync() ?? [];
      if (!notes || notes.length < 2) {
        return;
      }
      const notesToUpdate = notes.slice(0, 2);
      const timestamp = new Date().getTime();
      notesToUpdate.forEach((note, index) => {
        note.setText(`更新前2条数据 - ${index + 1} - ${timestamp}`);
        note.setComment(`updateInTxSync`);
      });
      this.noteDao.updateInTxSync(...notesToUpdate);
      this.list();
    } catch (error) {
      LogUtil.error('updateInTxSync测试失败:', error);
    }
  }

  insertInTxIterableSyncTest() {
    if (!this.noteDao) {
      return;
    }
    try {
      const newNotes: Note[] = [];
      for (let i = 0; i < 2; i++) {
        const note = new Note();
        note.setText(`批量插入笔记${i + 1}`);
        note.setComment(`insertInTxIterableSync`);
        newNotes.push(note);
      }
      this.noteDao.insertInTxIterableSync(newNotes);
      this.list();
    } catch (error) {
      LogUtil.error('insertInTxIterableSync测试失败:', error);
    }
  }

  insertInTxArrSyncTest() {
    if (!this.noteDao) {
      return;
    }
    try {
      const note1 = new Note();
      note1.setText('批量插入笔记 - ArrSync-1');
      note1.setComment('使用insertInTxArrSync接口插入');
      const note2 = new Note();
      note2.setText('批量插入笔记 - ArrSync-2');
      note2.setComment('insertInTxArrSync');
      this.noteDao.insertInTxArrSync(note1, note2);
      this.list();
    } catch (error) {
      LogUtil.error('insertInTxArrSync测试失败:', error);
    }
  }

  insertOrReplaceInTxIterableSyncTest() {
    if (!this.noteDao) {
      return;
    }
    try {
      let notesToInsert: Note[] = []
      let note1 = new Note()
      note1.setText('批量插入或替换实体')
      note1.setComment('insertOrReplaceInTxIterableSync')
      note1.setType(NoteType[NoteType.TEXT])
      notesToInsert.push(note1)
      this.noteDao.insertOrReplaceInTxIterableSync(notesToInsert)
      this.list()
    } catch (error) {
      LogUtil.error('insertOrReplaceInTxIterableSync error:', error)
    }
  }

  addNote() {
    if (!this.noteDao) {
      return;
    }
    let date = new Date()
    let comment = "Added on " + date.toLocaleString();
    let note = new Note();
    note.setText(comment);
    note.setComment("insertSync");
    note.setType(NoteType[NoteType.TEXT]);
    this.noteDao.insertSync(note);
  }

  getCount() {
    if (!this.noteDao) {
      return;
    }
    let queryBuilder: QueryBuilder<Note> = this.noteDao.queryBuilder();
    let countNumber = queryBuilder.countSync()
    let note = new Note();
    note.setText(`总共有${countNumber}条数据`);
    note.setComment("countSync");
    this.noteList = [note]
  }

  loadId2() {
    if (!this.noteDao) {
      return;
    }
    let tmp = this.noteDao.loadByRowIdSync(2);
    if (tmp) {
      let a = [tmp];
      this.noteList = a;
    } else {
      this.noteList = [];
    }
  }

  addArrayData() {
    if (!this.noteDao) {
      return;
    }
    try {
      // 创建5条Note类型的测试数据
      const notes = Array<number>(5).fill(0).map((_, index) => {
        let note = new Note();
        note.setText(`Huawei-${index}`);
        note.setComment(`insertOrReplaceInTxArrSync`);
        note.setType(NoteType[NoteType.TEXT]);
        return note;
      });
      this.noteDao?.setEntityUpdateAble(false);
      this.noteDao?.insertOrReplaceInTxArrSync(notes);
      this.loadAll();
    } catch (error) {
      LogUtil.error('批量插入数据失败:', error);
    }
  }

  insertWithoutSettingPkSyncTest() {
    if (!this.noteDao) {
      return;
    }
    try {
      let note = new Note();
      note.setText('不设置主键的插入测试');
      note.setComment('insertWithoutSettingPkSync');
      note.setType(NoteType[NoteType.TEXT]);
      const rowId = this.noteDao.insertWithoutSettingPkSync(note);
      this.loadAll();
    } catch (error) {
      LogUtil.error('insertWithoutSettingPkSync测试失败:', error);
    }
  }

  updateNotes() {
    if (this.notesQuery) {
      let notes = this.notesQuery.listSync();
      this.noteList = notes || []
    }
  }

  @Builder
  buildBtn(content: string, callback: () => void) {
    Button(content)
      .size({ width: 88, height: 40 })
      .onClick(callback)
      .padding(0)
      .margin({ right: 2, bottom: 2 })
  }

  @Builder
  itemEnd(item: Note) {
    Row() {
      Button("删除").margin('4vp').onClick(async () => {
        if (this.noteDao) {
          this.noteDao.deleteByKeySync(item.id)
        }
      })
      Button("修改").onClick(async () => {
        if (this.noteDao) {
          item.setText("updateSync")
          this.noteDao.updateSync(item)
        }
      })
      Button('save')
        .onClick(async () => {
          if (this.noteDao) {
            item.setText("Add One Item")
            this.noteDao.saveSync(item);
          }
        })
    }.padding('4vp').justifyContent(FlexAlign.SpaceEvenly)
  }

  build() {
    Column() {
      Text('同步接口demo')
        .fontSize(22)
        .fontWeight(FontWeight.Bold)
        .margin({ bottom: 20 })
        .height(50)
      Row() {
        this.buildBtn('插入一条', (): void => this.insertOneSync())
        this.buildBtn('批量插入', (): void => this.insertBatchSync())
        this.buildBtn('新增或更新第一条', (): void => this.saveInTxSync())
      }

      Row() {
        this.buildBtn('批量新增', (): void => this.addArrayData())
        this.buildBtn('insertWithoutSettingPkSync', (): void => this.insertWithoutSettingPkSyncTest())
        this.buildBtn('insertOrReplaceInTxIterableSync', (): void => this.insertOrReplaceInTxIterableSyncTest())
      }

      Row() {
        this.buildBtn('插入', (): void => this.addNote())
        this.buildBtn('批量插入(IterableSync)', (): void => this.insertInTxIterableSyncTest())
        this.buildBtn('批量插入(ArrSync)', (): void => this.insertInTxArrSyncTest())
      }

      Row() {
        this.buildBtn('加载全部', (): void => this.loadAll())
        this.buildBtn('加载首条', (): void => this.load())
        this.buildBtn('Loadid2的缓存', (): void => this.loadId2())
      }

      Row() {
        this.buildBtn('删除首条', (): void => this.deleteFirstOne())
        this.buildBtn('批量删除', (): void => this.deleteBatch())
        this.buildBtn('按Key删首条', (): void => this.deleteByKey())

      }

      Row() {
        this.buildBtn('按Keys批量删', (): void => this.deleteByKeys())
        this.buildBtn('删除id2数据', (): void => this.deleteByKeyInTxIterableAsync())
        this.buildBtn('删除id 1，3，5 数据', (): void => this.deleteInTxIterableSyncTest())
      }

      Row() {
        this.buildBtn('更新首条', (): void => this.updateFirstOne())
        this.buildBtn('更新前2头条', (): void => this.updateInTxSyncTest())
      }

      Row() {
        this.buildBtn('获取数据条数', (): void => this.getCount())
        this.buildBtn('刷新', (): void => this.list())
      }

      List({ space: 8 }) {
        ForEach(this.noteList, (item: Note, index: number) => {
          ListItem() {
            Column() {
              Text(`ID: ${item.getId()}  内容: ${item.getText()} 备注: ${item.getComment()}`)
                .fontSize(14)
            }
            .padding(8)
            .backgroundColor('#f5f5f5')
            .borderRadius(8)
          }.transition({ type: TransitionType.Delete, opacity: 0 })
          .swipeAction({
            end: {
              builder: () => {
                this.itemEnd(item)
              }
            }
          })
        })
      }
      .width("100%")
      .height(300)

      if (this.selectedNote) {
        Column() {
          Text('load 首条数据：')
            .fontSize(16)
            .fontWeight(FontWeight.Bold)
            .margin({ bottom: 4 })
          Text(`ID: ${this.selectedNote.getId()}  内容: ${this.selectedNote.getText()} 备注: ${this.selectedNote.getComment()}`)
            .fontSize(14)
        }
        .margin({top: 16})
        .padding(8)
        .backgroundColor('#e0f7fa')
        .borderRadius(8)
      }
    }
    .height('100%')
    .width('100%')
    .padding(16)
  }
}