//
//  RNToolPackage.m
//  myrnapp
//
//  Created by 李仕增 on 2022/10/10.
//

#import "RNToolPackage.h"

@implementation RNToolPackage

RCT_EXPORT_MODULE(RNToolsManager)

// 最简单的一个方法 变更多个bundle
RCT_REMAP_METHOD(changeActivity,
                 changeActivityWithA:( NSString *)bundlePath bunldeName:( NSString*)bunldeName
                 ){
    
    // 重新设置一个rootView
    dispatch_async(dispatch_get_main_queue(),^{
        [[NSNotificationCenter defaultCenter] postNotificationName:@"changeBunle" object:@{
            @"bundlePath":bundlePath,
            @"bunldeName":bunldeName,
        }];
    });
    
};

@end
