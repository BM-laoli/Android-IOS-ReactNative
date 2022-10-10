//
//  ReactController.m
//  myrnapp
//
//  Created by 李仕增 on 2022/10/10.
//

#import <Foundation/Foundation.h>
#import "ViewController.h"

@interface ReactController : NSObject
+(void)setBridge:(RCTBridge*) bridge;
+(RCTBridge*)getBridge;
@end

static RCTBridge *rctBridge = nil;

@implementation ReactController

+ (void)setBridge:(RCTBridge*)bridge{
    rctBridge = bridge;
};

+(RCTBridge*)getBridge{
  return rctBridge;
};

@end
