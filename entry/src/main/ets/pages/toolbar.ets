/*
 * Copyright (C) 2022 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import router from '@ohos.router';

@Component
@Preview
export struct Toolbar {
  title: string = 'title'
  isBack: boolean = false
  rightText: string = ''
  rightIcon: Resource | string = ''

  build() {
    Flex({ direction: FlexDirection.Row, alignItems: ItemAlign.Center, justifyContent: FlexAlign.Center }) {
      Flex({ direction: FlexDirection.Row, alignItems: ItemAlign.Start, justifyContent: FlexAlign.Start }) {
        Column() {
          Image($r("app.media.back")).width(40).height(40)
            .margin({ left: 20 })
        }
        .padding(10)
        .visibility(this.isBack ? Visibility.Visible : Visibility.Hidden)
        .onClick(e => {
          router.back()
        })
      }
      .width('20%')

      Flex({ direction: FlexDirection.Row, alignItems: ItemAlign.Center, justifyContent: FlexAlign.Center }) {
        Text(this.title).fontSize(20).fontColor('white')
      }
      .width('60%')

      Flex({ direction: FlexDirection.Row, alignItems: ItemAlign.End, justifyContent: FlexAlign.End }) {
        Stack() {
          Text('').visibility(Visibility.Hidden)
          if (this.rightText !== '') {
            Text(this.rightText).fontSize(30).fontColor('white')
          }
          if (this.rightIcon !== '') {
            Image(this.rightIcon).width(40).height(40)
              .margin({ right: 20 })
          }
        }
        .padding(10)
        .onClick(e => {
          //this.rightClickCallBack()
        })
      }
      .width('20%')
    }
    .width('100%')
    .height(60)
    .backgroundColor('#ff56ae97')
    .zIndex(99)
  }
}