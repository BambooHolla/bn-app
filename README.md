# The Ionic Super Starter 🎮

<img src="https://user-images.githubusercontent.com/236501/32385619-bddac0ac-c08c-11e7-9ee4-9c892197191f.png" width="400" />

The Ionic Super Starter is a batteries-included starter project for Ionic apps
complete with pre-built pages, providers, and best practices for Ionic
development.

The goal of the Super Starter is to get you from zero to app store faster than
before, with a set of opinions from the Ionic team around page layout,
data/user management, and project structure.

The way to use this starter is to pick and choose the various page types you
want use, and remove the ones you don't. If you want a blank slate, this
starter isn't for you (use the `blank` type instead).

One of the big advances in Ionic was moving from a rigid route-based navigation
system to a flexible push/pop navigation system modeled off common native SDKs.
We've embraced this pattern to provide a set of reusable pages that can be
navigated to anywhere in the app. Take a look at the [Settings
page](https://github.com/ionic-team/starters/blob/master/ionic-angular/official/super/src/pages/settings/settings.html)
for a cool example of a page navigating to itself to provide a different UI
without duplicating code.

## Table of Contents

2. [Pages](#pages)
3. [Providers](#providers)
4. [i18n](#i18n) (adding languages)

## Pages

The Super Starter comes with a variety of ready-made pages. These pages help
you assemble common building blocks for your app so you can focus on your
unique features and branding.

The app loads with the `FirstRunPage` set to `TutorialPage` as the default. If
the user has already gone through this page once, it will be skipped the next
time they load the app.

If the tutorial is skipped but the user hasn't logged in yet, the Welcome page
will be displayed which is a "splash" prompting the user to log in or create an
account.

Once the user is authenticated, the app will load with the `MainPage` which is
set to be the `TabsPage` as the default.

The entry and main pages can be configured easily by updating the corresponding
variables in
[src/pages/pages.ts](https://github.com/ionic-team/starters/blob/master/ionic-angular/official/super/src/pages/pages.ts).

Please read the
[Pages](https://github.com/ionic-team/starters/tree/master/ionic-angular/official/super/src/pages)
readme, and the readme for each page in the source for more documentation on
each.

一共有三个主要界面：欢迎页（教程页面、广告页面、解锁页面）、登录注册页、主界面
一个辅助页面：Iframepage（打开第三方网页时使用）

项目所有页面都采用动态加载的方案。

### 新的页面
创建新的页面时，使用命令行：

```
ionic g page yourPageName
```

然后在`your-page-name.ts`中，将`@IonicPage()`修改为：`@IonicPage({name:your-page-name"})`，统一使用小写+连接号的写法，如：`@IonicPage({ name: "tab-chain" })`

然后引入`bnqkl-framework/SecondLevelPage`：
```ts
import { SecondLevelPage } from "../../bnqkl-framework/SecondLevelPage";
import { TabsPage } from "../tabs/tabs";
export class YourPageName extends SecondLevelPage {
	constructor(public navCtrl: NavController, public navParams: NavParams,public tabs: TabsPage) {
		super(navCtrl, navParams, true, tabs);
	}
```
注意，在添加页面后可能需要重启项目。

再有，一般添加页面是添加二级页面，就如同上面的代码，项目中建议将二级页面进行归类，比如“我的联系人”页面：`account-my-contacts`，使用`account`开头，命名上对应`tab-account`的子页面，并且将这个页面转移到`pages/account`文件夹下。只有一些通用的页面，则是归类到`pages/common`中。

### 页面的跳转与拦截

在基于`SecondLevelPage`与`FirstLevelPage`的页面中，跳转统一使用`.routeTo(page_name)`来进行跳转，有的页面在进入前需要做一些判断，这类页面的拦截统一写在`FLP_Route.ts`中，使用`.registerRouteToBeforeCheck`进行注册拦截器。

### 页面的任务

有的页面是用来完成一些任务的，比如表单的提交，在这类页面执行完成完任务后，需要统一执行一次`.finishJob()`，来告知与其关联的页面自己的任务已经完成。

### 生命周期

使用`@YourPageName.willEnter/didEnter/willLeval/didLeval/onInit/onDestory`这些修饰器来修饰函数，从而赋予这些函数在对应的时间段自动执行的行为。

### 异步任务

建议使用async/await来描述，除非是简单的调度接口，然后使用`asyncCtrlGenerator.loading/error/success`来修饰这些返回Promise的方法。

## Api

所有请求都基于`providers/app-fetch`，对于频繁请求并且可以缓存的数据，使用`TB_AB_Generator(Token Base AsyncBehaviorSubjuet Generator)`基于用户登录Token的异步缓存生成器 来生成可缓存。

对于处理网络异常时，保证页面不为空的时候，可以用`.fetch.autoCatch(true).get/post`来强制缓存请求的数据，从而在网络异常的时候，能使用最近一次缓存数据进行显示（会伴随错误提示，如果有使用`@asyncCtrlGenerator.error`进行错误捕捉）。

## i18n

Ionic Super Starter comes with internationalization (i18n) out of the box with
[ngx-translate](https://github.com/ngx-translate/core). This makes it easy to
change the text used in the app by modifying only one file. 

### Adding Languages

To add new languages, add new files to the `src/assets/i18n` directory,
following the pattern of LANGCODE.json where LANGCODE is the language/locale
code (ex: en/gb/de/es/etc.).

### Changing the Language

To change the language of the app, edit `src/app/app.component.ts` and modify
`translate.use('en')` to use the LANGCODE from `src/assets/i18n/`
