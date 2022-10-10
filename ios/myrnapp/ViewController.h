//
//  ViewController.h
//  myrnapp
//
//  Created by 李仕增 on 2022/10/8.
//

#import <UIKit/UIKit.h>
#import <React/RCTBridge.h>

@interface RCTBridge (PackageBundle)

- (RCTBridge *)batchedBridge;
- (void)executeSourceCode:(NSData *)sourceCode sync:(BOOL)sync;

@end

@interface ViewController : UIViewController

@property (nonatomic, strong) RCTBridge *bridge;
-(void) loadScript:(NSString *)bundlePath bunldeName: (NSString *)bunldeName;
@end

