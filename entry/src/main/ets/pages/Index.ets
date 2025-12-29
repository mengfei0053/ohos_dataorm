/*
  * Copyright (c) 2022 Huawei Device Co., Ltd.
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

import { GlobalContext, Property } from '@ohos/dataorm';
import { DaoSession } from '@ohos/dataorm'
import { BaseDao } from '@ohos/dataorm'
import { Query } from '@ohos/dataorm'
import { QueryBuilder } from '@ohos/dataorm'
import { inquiry } from '@ohos/dataorm'
import { TableAction } from '@ohos/dataorm'
import { OnTableChangedListener } from '@ohos/dataorm'
import { Toolbar } from './toolbar'
import { Note } from './Note'
import { NoteType } from './NoteType'
import dataRdb from '@ohos.data.relationalStore';
import { QueryTest, QueryClass } from './util'

@Entry
@Component
struct Index {
  scroller: Scroller = new Scroller()
  @State arr: Array<Note> = new Array<Note>();
  @State editFlag: boolean = false
  @State noteText: string = ''
  private daoSession: DaoSession | null = null;
  private noteDao: BaseDao<Note, number> | null = null;
  private notesQuery: Query<Note> | null = null;

  build() {
    Flex({ direction: FlexDirection.Column, alignItems: ItemAlign.Center }) {
      Toolbar({ title: 'dataORM', isBack: true })
      Flex() {
        TextInput({ placeholder: 'Enter new note' })
          .type(InputType.Normal)
          .placeholderColor(Color.Gray)
          .placeholderFont({ size: 20, weight: 2 })
          .enterKeyType(EnterKeyType.Search)
          .caretColor(Color.Green)
          .layoutWeight(3)
          .height(45)
          .borderRadius('0px')
          .backgroundColor(Color.White)
          .onChange((value: string) => {
            this.noteText = value
          })
        Button('ADD')
          .fontSize(13)
          .fontWeight(FontWeight.Bold)
          .layoutWeight(1)
          .onClick((event: ClickEvent | undefined) => {
            this.addNote()
          })
        Button('Query')
          .fontSize(13)
          .fontWeight(FontWeight.Bold)
          .layoutWeight(1)
          .onClick((event: ClickEvent | undefined) => {
            this.query()
          })
      }
      .margin({ top: 12 })
      .height('10%')

      Flex() {
        Button('Delete bbb and Query')
          .height(45)
          .fontSize(12)
          .padding({ top: 8, left: 8 })
          .layoutWeight(1)
          .onClick((event: ClickEvent | undefined) => {
            this.deleteNotes()
          })
        Button('Query aaa bbb ccc')
          .height(45)
          .fontSize(12)
          .padding({ top: 8 })
          .layoutWeight(1)
          .onClick((event: ClickEvent | undefined) => {
            this.selectWhere()
          })
        Button('IN 查询 Demo')
          .height(45)
          .fontSize(12)
          .padding({ top: 8, right: 8 })
          .layoutWeight(1)
          .onClick(() => {
            this.queryInDataDemo()
          })
      }
      .margin({ top: 12 })
      .height('10%')

      Flex() {
        Button($r('app.string.Load_ID_2'))
          .height(45)
          .fontSize(12)
          .padding({ top: 1, left: 8 })
          .layoutWeight(1)
          .onClick((event: ClickEvent | undefined) => {
            this.loadId2();
          })
        Button($r('app.string.Save_No_PK'))
          .height(45)
          .fontSize(12)
          .padding({ top: 1 })
          .layoutWeight(1)
          .onClick(async (event: ClickEvent | undefined) => {
            if (this.noteDao) {
              let note = new Note();
              note.setText("Note_a");
              await this.noteDao.saveAsync(note)
            }
          })
      }.margin({ top: 5 })
      .height('10%')

      Flex() {
        Button('flexQuery')
          .height(45)
          .fontSize(12)
          .layoutWeight(1)
          .onClick(async (event: ClickEvent | undefined) => {
            this.arr = await QueryClass(Note)
          })
        Button('query id 2')
          .height(45)
          .fontSize(12)
          .layoutWeight(1)
          .onClick(async (event: ClickEvent | undefined) => {
            this.arr = await QueryTest("ID", 2)
          })
        Button('query aaa')
          .height(45)
          .fontSize(12)
          .layoutWeight(1)
          .onClick(async (event: ClickEvent | undefined) => {
            this.arr = await QueryTest("TEXT", "aaa")
          })
      }.padding({ top: 4, left: 10 })
      .height('10%')
      .margin({ top: 4, left: 10 })

      Stack({ alignContent: Alignment.TopStart }) {
        Scroll(this.scroller) {
          List({ space: 20, initialIndex: 0 }) {
            ForEach(this.arr, (item: Note) => {
              ListItem() {
                Flex({ direction: FlexDirection.Row, wrap: FlexWrap.Wrap }) {
                  Text('' + item.text)
                    .fontSize(13)
                  Button("删除").onClick(async () => {
                    if (this.noteDao) {
                      await this.noteDao.deleteByKeyAsync(item.id)
                    }
                  })
                  Button("修改").onClick(async () => {
                    if (this.noteDao) {
                      item.setText(this.noteText)
                      await this.noteDao.updateAsync(item)
                    }
                  })
                  Button('save')
                    .onClick(async () => {
                      if (this.noteDao) {
                        item.setText(this.noteText)
                        await this.noteDao.saveAsync(item);
                      }
                    })
                  Button('refresh')
                    .onClick(async () => {
                      if (this.noteDao) {
                        item.setText(this.noteText)
                        await this.noteDao.refresh(item);
                        let that = this
                        this.arr = [];
                        setTimeout(() => {
                          that.updateNotes();
                        }, 100)
                      }
                    })
                  Button('refresh前修改')
                    .onClick(() => {
                      this.refreshUpdate(item.id)
                    })
                }.width('100%')
              }
            })
          }
          .listDirection(Axis.Vertical) // 排列方向
          .divider({ strokeWidth: 2, color: 0xFFFFFF, startMargin: 20, endMargin: 20 }) // 每行之间的分界线
          .edgeEffect(EdgeEffect.None) // 滑动到边缘无效果
          .chainAnimation(false) // 联动特效关闭
          .onScrollIndex((firstIndex: number, lastIndex: number) => {
          })
          .width('90%')
          .margin({ left: 15, right: 15 })
        }
        .scrollable(ScrollDirection.Vertical)
        .scrollBar(BarState.Off)
        .scrollBarColor(Color.Gray)
        .scrollBarWidth(30)
      }
      .height('60%')
      .width('100%')
    }
    .width('100%')
    .height('100%')
  }

  refreshUpdate(id: number) {
    let data = new Array<Note>();
    let tmpArr = this.arr;
    this.arr = [];
    for (let i = 0;i < tmpArr.length; i++) {
      if (tmpArr[i].id === id) {
        tmpArr[i].text = tmpArr[i].text + "--2"
      }
      data[i] = tmpArr[i]
    }
    let that = this;
    setTimeout(() => {
      that.arr = data;
    }, 100)
  }

  async addNote() {
    if (!this.noteDao) {
      return;
    }
    let date = new Date()
    let comment = "Added on " + date.toLocaleString();
    let note = new Note();
    note.setText(this.noteText);
    note.setComment(comment);
    note.setType(NoteType[NoteType.TEXT]);
    await this.noteDao.insert(note);
  }

  async updateNotes() {
    if (this.notesQuery) {
      this.arr = await this.notesQuery.list();
    }
  }

  async query() {
    if (!this.noteDao) {
      return;
    }
    let entityClass = GlobalContext.getContext().getValue(GlobalContext.KEY_CLS) as Record<string, Object>;
    let properties = entityClass.Note as Record<string, Property>;
    let query = this.noteDao.queryBuilder().orderAsc(properties.text).buildCursor();
    let a = await query.list();
    if (!a) a = [];
    this.arr = a;
  }

  async deleteNotes() {
    if (!this.noteDao) {
      return;
    }
    let entityClass = GlobalContext.getContext().getValue(GlobalContext.KEY_CLS) as Record<string, Object>;
    let properties = entityClass.Note as Record<string, Property>;
    let deleteQuery = this.noteDao.queryBuilder().where(properties.text.eq("bbb"))
      .buildDelete();
    deleteQuery.executeDeleteWithoutDetachingEntities()
  }

  async selectWhere() {
    if (!this.noteDao) {
      return;
    }
    let queryBuilder: QueryBuilder<Note> = this.noteDao.queryBuilder();
    let entityClass = GlobalContext.getContext().getValue(GlobalContext.KEY_CLS) as Record<string, Object>;
    let properties = entityClass.Note as Record<string, Property>;
    queryBuilder.whereOr(properties['text'].eq("aaa"), properties.text.eq("bbb"), properties.text.eq("ccc"));
    let aa: Array<Note> = await queryBuilder.list() ?? [];
    this.arr = aa;
  }

  async queryInDataDemo() {
    if (!this.noteDao) {
      return;
    }
    const entityClass = GlobalContext.getContext().getValue(GlobalContext.KEY_CLS) as Record<string, Object>;
    const properties = entityClass.Note as Record<string, Property>;
    const keywords: string[] = ['aaa', 'ccc'];
    const whereCondition = properties.text?.inData(keywords);
    if (!whereCondition) {
      return;
    }
    const results = await this.noteDao.queryBuilder().where(whereCondition).list() ?? [];
    this.arr = results;
  }

  public aboutToAppear() {
    this.getAppData();
  }

  getAppData() {
    this.daoSession = GlobalContext.getContext().getValue("daoSession") as DaoSession;
    this.noteDao = this.daoSession.getBaseDao(Note);
    if (!this.noteDao) {
      return;
    }
    /*
     *添加监听
     */
    this.noteDao.addTableChangedListener(this.tabListener())
    let entityClass = GlobalContext.getContext().getValue(GlobalContext.KEY_CLS) as Record<string, Object>;
    let properties = entityClass.Note as Record<string, Property>;
    this.notesQuery = this.noteDao.queryBuilder().orderAsc(properties.text).build();
  }

  onBackPress() {
    /**
     * 移除监听
     */
    if (this.noteDao) {
      this.noteDao.removeTableChangedListener();
    }
  }

  tabListener(): OnTableChangedListener<dataRdb.ResultSet> {
    let that = this;
    return {
      async onTableChanged(t: dataRdb.ResultSet, action: TableAction) {
        if (action === TableAction.INSERT) {
          console.info('--------insert--------')
          await that.updateNotes();
        } else if (action === TableAction.UPDATE) {
          console.info('--------edit--------')
          await that.updateNotes();
        } else if (action === TableAction.DELETE) {
          console.info('--------delete--------')
          await that.updateNotes();
        } else if (action === TableAction.QUERY) {
          console.info('--------query-------- any:' + JSON.stringify(t))
        }
      }
    }
  }

  async loadId2() {
    if (!this.noteDao) {
      return;
    }
    let tmp = await this.noteDao.load(2);
    if (tmp) {
      let a = [tmp];
      this.arr = a;
    } else {
      this.arr = [];
    }

  }
}