//
//  ViewController.m
//  myrnapp
//
//  Created by 李仕增 on 2022/10/8.
//

#import "ViewController.h"
#import <React/RCTRootView.h>

@interface ViewController ()

@end

@implementation ViewController


-(instancetype) init {
    self = [super init];
    [self initBridge];
    [self addObservers];
    return  self;
};

- (void) initBridge {
    if(!self.bridge) {
        NSURL *jsCodeLocation = [[NSBundle mainBundle] URLForResource:@"bundle/common.ios" withExtension:@"bundle"];
       // 初始化 bridge，并且加载主包
        self.bridge = [[RCTBridge alloc] initWithBundleURL:jsCodeLocation moduleProvider:nil launchOptions:nil];
    }
};

- (void) viewDidLoad {
    [super viewDidLoad];
    
//    加一些oc 的code 确保项目上正常的状态
    UIView *view = [[UIView alloc] init];
    view.backgroundColor = [UIColor redColor];
    view.frame = CGRectMake(100,100, 100, 100);
    [self.view addSubview:view];

    view.userInteractionEnabled = YES;
    UITapGestureRecognizer *tap = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(loadScriptWithBridge)];
    [view addGestureRecognizer:tap];

    UIView *view2 = [[UIView alloc] init];
    view2.backgroundColor = [UIColor greenColor];
    view2.frame = CGRectMake(150,300, 100, 100);
    [self.view addSubview:view2];
    
    view2.userInteractionEnabled = YES;
    UITapGestureRecognizer *tap2 = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(openRNView2)];
    [view2 addGestureRecognizer:tap2];
    
//    直接开始集成
}

- (void) testClick {
    NSLog(@"6666666");
}

- (void)openRNView {
    NSLog(@"High Score Button Pressed");
    NSURL *jsCodeLocation = [NSURL URLWithString:@"http://localhost:8082/IOS.bundle?platform=ios"];

        RCTRootView *rootView =
          [[RCTRootView alloc] initWithBundleURL: jsCodeLocation
                                      moduleName: @"RNHighScores"
                               initialProperties: nil
                                   launchOptions: nil];
        UIViewController *vc = [[UIViewController alloc] init];
        vc.view = rootView;
        [self presentViewController:vc animated:YES completion:nil];
 }

- (void)openRNView2 {
    
//    NSURL *jsCodeLocation = [NSURL URLWithString:@"http://localhost:8082/IOS2.bundle?platform=ios"];
    NSURL *jsCodeLocation = [[NSBundle mainBundle] URLForResource:@"bundle/IOS2.ios" withExtension:@"bundle"];

    
    RCTRootView *rootView = [[RCTRootView alloc]
                             initWithBundleURL:jsCodeLocation
                             moduleName:@"RNHighScores2"
                             initialProperties:nil
                             launchOptions:nil ];
    
        UIViewController *vc = [[UIViewController alloc] init];
        vc.view = rootView;
        [self presentViewController:vc animated:YES completion:nil];
};

// 设它为 IOS2 main 模块
- (void)loadScriptWithBridge {
    [self loadScript:@"bundle/IOS2.ios" bunldeName:@"IOS2"];
};

- (void)changeView:(NSNotification *)notif{
    
    
    NSString *bundlePath = @"";
    NSString *bunldeName = @"";
    bundlePath = [notif.object valueForKey:@"bundlePath"];
    bunldeName = [notif.object valueForKey:@"bunldeName"];
    
//    [self dismissViewControllerAnimated:YES completion:nil];
    
// 重制 原先的bridge 要不然会有问题
//    NSURL *jsCodeLocation = [[NSBundle mainBundle] URLForResource:@"bundle/common.ios" withExtension:@"bundle"];
//
//    self.bridge = [[RCTBridge alloc] initWithBundleURL:jsCodeLocation moduleProvider:nil launchOptions:nil];
    
    [self loadScript:bundlePath bunldeName:bunldeName];
};


- (void)addObservers {
    // 监听通知
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(changeView:) name:@"changeBunle" object:nil];
};

- (void)removeObservers {
    // 监听通知
    [[NSNotificationCenter defaultCenter] removeObserver:self];
};

- (void)dealloc {
    [self removeObservers];
};

-(void) loadScript:(NSString *)bundlePath bunldeName: (NSString *)bunldeName {
    
    NSURL  *jsCodeLocation = [[NSBundle mainBundle] URLForResource:bundlePath withExtension:@"bundle"];
    
    if(self.bridge) {
        NSError *error = nil;
        NSData *sourceBuz = [NSData dataWithContentsOfFile:jsCodeLocation.path
                                                options:NSDataReadingMappedIfSafe
                                                  error:&error];
        
        [self.bridge.batchedBridge executeSourceCode:sourceBuz sync:NO];
        
        RCTRootView *rootView =
          [[RCTRootView alloc] initWithBridge:self.bridge moduleName:bunldeName initialProperties:nil];
        UIViewController *vc = [[UIViewController alloc] init];
        
//        [self setView: rootView];
        // 第一次的时候没有 添加
        if(self.vc1 == nil) {
            vc.view = rootView;
            [self presentViewController:vc animated:YES completion:nil];
            self.vc1 = vc;
            return;
        }
        
        // 第二次的时候 从第一次上面再此添加
        vc.view = rootView;
        self.vc2 = vc;
        [self.vc1 presentViewController: self.vc2 animated:YES completion:nil];
        
    };
}
@end
