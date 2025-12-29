/*
  * Copyright (c) 2024 Huawei Device Co., Ltd.
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
import { GlobalContext } from '@ohos/dataorm';
import { ExampleOpenHelper } from './ExampleOpenHelper';
import { Note } from './Note';
import { Student } from './Student';
import { Teacher } from './Teacher';

@Entry
@Component
struct CustomDir {
  scroller: Scroller = new Scroller();
  context: Context | undefined;
  @State dirArr: Array<string> = [];
  @State arr: Array<string> = new Array<string>();
  @State text: string = '';

  async aboutToAppear() {
    this.context = GlobalContext.getContext().getValue(GlobalContext.KEY_CTX) as Context;
  }

  /**
   * 通过终端执行 hdc file recv /data/app/el2/100/database/cn.openharmony.dataorm/entry/rdb 本地路径
   * 查看该目录下是否创建出自定义路径的数据库
   */
  async createDataBase() {
    const helper: ExampleOpenHelper = new ExampleOpenHelper(this.context, "note.db", this.text);
    await helper.getWritableDb();
    helper.setEntities(Note, Student, Teacher)
    if(this.text && this.arr.indexOf(this.text) === -1) {
      this.arr.push(this.text);
      this.text = '';
    }
  }

  build() {
    Column() {
      Flex({justifyContent: FlexAlign.SpaceBetween}) {
        TextInput({ placeholder: 'Enter Custom Dir', text: this.text })
          .type(InputType.Normal)
          .placeholderColor(Color.Gray)
          .placeholderFont({ size: 20, weight: 2 })
          .enterKeyType(EnterKeyType.Search)
          .caretColor(Color.Green)
          .layoutWeight(3)
          .width(150)
          .height(45)
          .border({
            width: 2,
            color: Color.Black,
            radius: 8
          })
          .backgroundColor(Color.White)
          .onChange((value: string) => {
            this.text = value;
          })
        Button($r('app.string.Create_DB'))
          .height(45)
          .fontSize(20)
          .onClick(() => {
            this.createDataBase();
          })
      }
      Column() {
        // 数据库路径
        Scroll(this.scroller) {
          List({ space: 20, initialIndex: 0 }) {
            ForEach(this.arr, (item: string) => {
              ListItem() {
                Flex({ direction: FlexDirection.Row, wrap: FlexWrap.Wrap }) {
                  Text('Custom dir: ' + item)
                    .margin(10)
                    .fontSize(20)
                    .fontWeight(FontWeight.Bold)
                    .fontColor(Color.Red)
                }.width('100%')
              }
            })
          }
          .listDirection(Axis.Vertical) // 排列方向
          .divider({ strokeWidth: 2, color: 0xFFFFFF, startMargin: 20, endMargin: 20 }) // 每行之间的分界线
          .edgeEffect(EdgeEffect.None) // 滑动到边缘无效果
          .chainAnimation(false) // 联动特效关闭
          .width('90%')
          .margin({ left: 15, right: 15 })
        }
        .scrollable(ScrollDirection.Vertical)
        .scrollBar(BarState.Off)
        .scrollBarColor(Color.Gray)
        .scrollBarWidth(30)
      }
      .height('90%')
      .width('100%')
    }
    .width('100%')
    .height('100%')
  }
}