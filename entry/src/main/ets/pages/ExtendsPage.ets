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

import { BaseDao, DaoSession, GlobalContext, OnTableChangedListener, Property, TableAction } from '@ohos/dataorm';
import { Toolbar } from './toolbar';
import { Note } from './Note';
import { NoteType } from './NoteType';
import dataRdb from '@ohos.data.relationalStore';

@Entry
@Component
struct ExtendsPage {
  scoller: Scroller = new Scroller();
  @State arr: Array<Note> = new Array<Note>();
  @State editFlag: boolean = false;
  @State noteText: string = '';
  @State isShow: boolean = true;
  private daoSession: DaoSession | null = null;
  private noteDao: BaseDao<Note, number> | null = null;
  private dateTime: string = '12/12/2012, 12:12:12 PM';
  controller:TextAreaController = new TextAreaController();
  tips: string = this.getResourceString($r('app.string.Tips'));

  getResourceString(res:Resource){
    return getContext().resourceManager.getStringSync(res.id)
  }

  @Styles
  spaceAround() {
    .margin({ left: 5, right: 5 })
  }

  build() {
    Flex({ direction: FlexDirection.Column, alignItems: ItemAlign.Center }) {
      Toolbar({ title: 'Extends', isBack: true })
      Flex({ alignItems: ItemAlign.Center, justifyContent: FlexAlign.SpaceAround }) {
        TextInput({ placeholder: 'Enter note', text: this.noteText })
          .placeholderColor(Color.Gray)
          .placeholderFont({ size: 20, weight: 2 })
          .enterKeyType(EnterKeyType.Search)
          .caretColor(Color.Green)
          .layoutWeight(2)
          .height(45)
          .borderRadius(5)
          .backgroundColor('#E5E5E5')
          .onChange((value: string) => {
            this.noteText = value;
          })

        Button('ADD')
          .fontSize(13)
          .fontWeight(FontWeight.Bold)
          .margin({ left: 5, right: 5 })
          .onClick((event: ClickEvent | undefined) => {
            this.addNote();
          })
      }
      .margin({ top: 5 })
      .padding({ left: 5, right: 5 })
      .height('8%')

      Flex({ justifyContent: FlexAlign.SpaceAround, alignItems: ItemAlign.Center }) {
        Button($r('app.string.Modify_creatTime'))
          .height(45)
          .fontSize(12)
          .width(150)
          .onClick(async (event: ClickEvent | undefined) => {
            if (this.arr.length > 0 && this.noteDao) {
              for (let note of this.arr) {
                if (note.getCreateTime() !== this.dateTime) {
                  note.setCreateTime(this.dateTime);
                  note.setDate(null);
                  note.setMoneys(null);
                  await this.noteDao.updateAsync(note);
                  break;
                }
              }
              this.query();
            }
          })

        Button($r('app.string.Delete_createTime'))
          .height(45)
          .fontSize(12)
          .width(150)
          .onClick(async (event: ClickEvent | undefined) => {
            this.deleteNotes();
          })
      }
      .padding({ left: 5, right: 5 })
      .height('8%')

      TextArea({
        controller: this.controller,
        text: this.tips
      })
        .width("100%")
        .fontSize(13)
        .margin({left:5,right:5})

      Divider()
        .strokeWidth(2)
        .color('#ffeceeef')
        .margin({ top: 5, bottom: 5 })

      Stack({ alignContent: Alignment.TopStart }) {
        List({ space: 20, initialIndex: 0 }) {
          ForEach(this.arr, (item: Note) => {
            ListItem() {
              Row() {
                Flex({ alignItems: ItemAlign.Center, justifyContent: FlexAlign.Start }) {
                  Text(item.createTime)
                    .fontSize(13)
                    .maxLines(1)
                    .fontColor(Color.Blue)
                    .visibility(this.isShow ? Visibility.Visible : Visibility.Hidden)
                  Divider()
                    .vertical(true)
                    .strokeWidth(1)
                    .height(22)
                    .color('#ff2bde92')
                    .margin({ left: 2, right: 2 })
                  Text(item.text)
                    .fontSize(13)
                    .maxLines(1)
                    .width('50%')
                    .textOverflow({ overflow: TextOverflow.Ellipsis })
                }
                .width('85%')

                Flex({ alignItems: ItemAlign.Center, justifyContent: FlexAlign.SpaceAround }) {
                  Text($r('app.string.Delete'))
                    .fontSize(10)
                    .fontColor('#3E94FF')
                    .onClick(async () => {
                      if (this.noteDao) {
                        await this.noteDao.deleteByKeyAsync(item.id);
                      }
                    })
                  Text($r('app.string.Update'))
                    .fontSize(10)
                    .fontColor('#3E94FF')
                    .onClick(async () => {
                      if (this.noteDao) {
                        item.setText(this.noteText);
                        item.setDate(null);
                        item.setMoneys(null);
                        await this.noteDao.updateAsync(item);
                      }
                    })
                }
                .width('15%')
              }
              .width('100%')
              .alignItems(VerticalAlign.Center)
              .justifyContent(FlexAlign.Start)
              .padding({ left: 5, right: 5 })
            }
          })
        }
        .listDirection(Axis.Vertical)
        .divider({ strokeWidth: 2, color: '#ffeceeef' })
        .width('100%')
      }
      .height('60%')
      .width('100%')
    }
    .height('100%')
    .width('100%')
  }

  async addNote() {
    if (!this.noteDao) {
      return;
    }
    let date = new Date();
    let comment = "Added on " + date.toLocaleString();
    let note = new Note();
    note.setText(this.noteText);
    note.setComment(comment);
    note.setType(NoteType[NoteType.TEXT]);
    note.setCreateTime(date.toLocaleString());
    await this.noteDao.insert(note);
    this.noteText = '';
  }

  async query() {
    if (!this.noteDao) {
      return;
    }
    let query = this.noteDao.queryBuilder().buildCursor();
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
    let deleteQuery = this.noteDao.queryBuilder().where(properties.createTime.eq(this.dateTime)).buildDelete();
    await deleteQuery.executeDeleteWithoutDetachingEntities();
  }

  public aboutToAppear() {
    this.getAppData();
    this.query();
  }

  aboutToDisappear(): void {
    if (this.noteDao) {
      this.noteDao.removeTableChangedListener();
    }
  }

  getAppData() {
    this.daoSession = GlobalContext.getContext().getValue("daoSession") as DaoSession;
    this.noteDao = this.daoSession.getBaseDao(Note);
    if (!this.noteDao) {
      return;
    }
    // 添加监听
    this.noteDao.addTableChangedListener(this.tabListener())
  }

  tabListener(): OnTableChangedListener<dataRdb.ResultSet> {
    let _this = this;
    let actionsArray: TableAction[] = [TableAction.INSERT, TableAction.UPDATE, TableAction.DELETE];
    return {
      async onTableChanged(t: dataRdb.ResultSet, action: TableAction) {
        if (actionsArray.includes(action)) {
          console.info('tabListener includes action:' + action.toString());
          await _this.query();
        } else {
          console.info('tabListener else branch:' + action.toString());
        }
      }
    }
  }
}