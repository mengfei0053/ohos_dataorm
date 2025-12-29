/*
 * Copyright (c) 2022 Huawei Device Co., Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  BaseDao,
  DaoSession,
  GlobalContext,
  OnTableChangedListener,
  Property,
  Query,
  TableAction
} from '@ohos/dataorm';
import { Note } from './Note';
import dataRdb from '@ohos.data.relationalStore';

@Entry
@Component
struct SavePage {
  @State replaceTest: string = 'Hello World';
  @State saveText: string = "";
  @State arr: Array<Note> = new Array<Note>();
  @State resultMessage: string = "Result："
  private daoSession: DaoSession | null = null;
  private noteDao: BaseDao<Note, number> | null = null;
  private notesQuery: Query<Note> | null = null;
  private mNote = new Note();

  build() {
    Row() {
      Column() {
        Text(this.resultMessage)
          .fontSize(15).margin({ bottom: 20 })

        TextInput({ placeholder: $r('app.string.Replace_node_data') })
          .type(InputType.Normal)
          .placeholderColor(Color.Gray)
          .placeholderFont({ size: 20, weight: 2 })
          .enterKeyType(EnterKeyType.Search)
          .caretColor(Color.Green)
          .height(45)
          .borderRadius('0px')
          .backgroundColor(Color.White)
          .onChange((value: string) => {
            this.replaceTest = value
          })
        Button($r('app.string.inertOrReplace_same_object'))
          .fontSize(13)
          .width(310)
          .height(50)
          .margin({ top: 50, bottom: 50 })
          .fontWeight(FontWeight.Bold)
          .onClick(() => {
            this.addOrReplace(this.replaceTest);
          })

        Button($r('app.string.inertOrReplace_new_object'))
          .fontSize(13)
          .width(310)
          .height(50)
          .margin({ top: 50, bottom: 50 })
          .fontWeight(FontWeight.Bold)
          .onClick(() => {
            this.addOrReplaceNew(this.replaceTest);
          })

        TextInput({ placeholder: $r('app.string.Save_node_data') })
          .type(InputType.Normal)
          .placeholderColor(Color.Gray)
          .placeholderFont({ size: 20, weight: 2 })
          .enterKeyType(EnterKeyType.Search)
          .caretColor(Color.Green)
          .height(45)
          .borderRadius('0px')
          .backgroundColor(Color.White)
          .onChange((value: string) => {
            this.saveText = value
          })

        Button("save")
          .fontSize(13)
          .width(310)
          .height(50)
          .margin({ top: 50, bottom: 50 })
          .fontWeight(FontWeight.Bold)
          .onClick(() => {
            this.addSave(this.saveText)
          })
        Button("Query")
          .fontSize(13)
          .width(310)
          .height(50)
          .fontWeight(FontWeight.Bold)
          .onClick(() => {
            this.query();
          })
      }
      .width('100%')
    }
    .height('100%')
  }

  async addOrReplace(str: string) {
    if (this.noteDao) {
      this.mNote.setText(str);
      await this.noteDao.insertOrReplace(this.mNote);
    }
  }

  async addOrReplaceNew(str: string) {
    if (this.noteDao) {
      let node = new Note();
      node.setText(str);
      await this.noteDao.insertOrReplace(node);
    }
  }

  async addSave(str: string) {
    if (this.noteDao) {
      let node = new Note();
      node.setText(str);
      await this.noteDao.saveAsync(node);
    }
  }

  async query() {
    if (!this.noteDao) {
      return;
    }
    //方式一
    let entityClass = GlobalContext.getContext().getValue(GlobalContext.KEY_CLS) as Record<string, Object>;
    let properties = entityClass.Note as Record<string, Property>;
    let query = this.noteDao.queryBuilder().orderAsc(properties.text).buildCursor();
    let a = await query.list() ?? [];
    let str = '';
    for (let i = 0; i < a.length; i++) {
      const element = a[i];
      str += JSON.stringify(element);
    }
    this.resultMessage = str;
  }

  public aboutToAppear() {
    this.getAppData();
  }

  getAppData() {
    this.daoSession = GlobalContext.getContext().getValue("daoSession") as DaoSession;

    this.noteDao = this.daoSession.getBaseDao(Note);
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

  async updateNotes() {
    if (this.notesQuery) {
      this.arr = await this.notesQuery.list();
    }
  }
}