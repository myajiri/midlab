// ============================================
// TurboModule voidメソッドのクラッシュ修正パッチ
// patch-packageが適用されない場合のフォールバック
//
// 問題: performVoidMethodInvocationの@catchブロックで
// convertNSExceptionToJSErrorがバックグラウンドスレッドから
// Hermesランタイムにアクセスし、GCScope破損→SIGSEGVを引き起こす
// ============================================

const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const PATCH_MARKER = '[MidLab-TurboModulePatch]';

module.exports = function withTurboModulePatch(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const filePath = path.join(
        config.modRequest.projectRoot,
        'node_modules',
        'react-native',
        'ReactCommon',
        'react',
        'nativemodule',
        'core',
        'platform',
        'ios',
        'ReactCommon',
        'RCTTurboModule.mm'
      );

      if (!fs.existsSync(filePath)) {
        console.warn('[TurboModulePatch] RCTTurboModule.mm not found, skipping');
        return config;
      }

      let content = fs.readFileSync(filePath, 'utf-8');

      // 既にパッチ適用済みならスキップ
      if (content.includes(PATCH_MARKER)) {
        console.log('[TurboModulePatch] Already applied');
        return config;
      }

      // パッチ対象: performVoidMethodInvocation内の@catchブロック
      // 元のコード: throw convertNSExceptionToJSError(runtime, exception, std::string{moduleName}, methodNameStr);
      // ただし performMethodInvocation (非void) にも同じ行があるので、
      // performVoidMethodInvocation内のものだけを対象にする
      //
      // 戦略: @try { [inv invokeWithTarget:strongModule]; } @catch の
      // パターンを探して、performVoidMethodInvocation内のものを特定する

      const oldPattern =
        '    @try {\n' +
        '      [inv invokeWithTarget:strongModule];\n' +
        '    } @catch (NSException *exception) {\n' +
        '      throw convertNSExceptionToJSError(runtime, exception, std::string{moduleName}, methodNameStr);\n' +
        '    } @finally {\n' +
        '      [retainedObjectsForInvocation removeAllObjects];\n' +
        '    }';

      const newCode =
        '    @try {\n' +
        '      [inv invokeWithTarget:strongModule];\n' +
        '    } @catch (NSException *exception) {\n' +
        '      // ' + PATCH_MARKER + ' voidメソッドの例外でHermesランタイムに再入しない\n' +
        '      // convertNSExceptionToJSErrorはバックグラウンドスレッドからJSI Runtimeにアクセスし、\n' +
        '      // Hermes GCScope破損によるSIGSEGVを引き起こすため、ログのみに留める\n' +
        '      NSLog(@"[TurboModule] Exception in void method %s.%s: %@ - reason: %@",\n' +
        '            moduleName, methodName, exception.name, exception.reason);\n' +
        '    } @finally {\n' +
        '      [retainedObjectsForInvocation removeAllObjects];\n' +
        '    }';

      // performVoidMethodInvocation 関数内の最初のマッチのみ置換
      const funcStart = content.indexOf('void ObjCTurboModule::performVoidMethodInvocation(');
      if (funcStart === -1) {
        console.warn('[TurboModulePatch] performVoidMethodInvocation not found');
        return config;
      }

      const searchRegion = content.substring(funcStart);
      const matchIndex = searchRegion.indexOf(oldPattern);

      if (matchIndex === -1) {
        // patch-packageで既に適用済みの可能性
        console.log('[TurboModulePatch] Target code not found (patch-package may have already applied)');
        return config;
      }

      const absoluteIndex = funcStart + matchIndex;
      content =
        content.substring(0, absoluteIndex) +
        newCode +
        content.substring(absoluteIndex + oldPattern.length);

      fs.writeFileSync(filePath, content, 'utf-8');
      console.log('[TurboModulePatch] Successfully applied');

      return config;
    },
  ]);
};
