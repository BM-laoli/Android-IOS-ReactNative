//
//  AppDelegate.h
//  myrnapp
//
//  Created by 李仕增 on 2022/10/8.
//

#import <UIKit/UIKit.h>
#import <CoreData/CoreData.h>
#import <React/RCTBridge.h>

@interface AppDelegate : UIResponder <UIApplicationDelegate>

@property (readonly, strong) NSPersistentContainer *persistentContainer;
@property (nonatomic, strong) UIWindow * window;

- (void)saveContext;


@end

