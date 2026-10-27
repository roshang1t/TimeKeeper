// Adds "Edit widget" to TimeKeeper's Android home screen widgets.
//
// expo-widgets only supports configurable widgets on iOS. On Android the launcher shows
// "Edit widget" when a widget declares a configuration activity, so this plugin:
//   1. writes a tiny transparent WidgetConfigureActivity that accepts the widget and opens
//      timekeeper://widget-settings (app/widget-settings.tsx),
//   2. registers it in AndroidManifest.xml for APPWIDGET_CONFIGURE,
//   3. marks every expo-widgets provider XML as reconfigurable, with configuration optional
//      so adding a widget doesn't force the settings screen open.
//
// Must be listed BEFORE "expo-widgets" in app.json: mods run newest-first, so this one's
// file edits then run after expo-widgets has generated the provider XML.

const {
  AndroidConfig,
  withAndroidManifest,
  withDangerousMod,
} = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const ACTIVITY = "WidgetConfigureActivity";
const DEEP_LINK = "timekeeper://widget-settings";

const activitySource = (androidPackage) => `package ${androidPackage}

import android.app.Activity
import android.appwidget.AppWidgetManager
import android.content.Intent
import android.net.Uri
import android.os.Bundle

// "Edit widget" on the home screen: accept the widget, then open the app's widget settings.
class ${ACTIVITY} : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    val appWidgetId = intent?.getIntExtra(
      AppWidgetManager.EXTRA_APPWIDGET_ID,
      AppWidgetManager.INVALID_APPWIDGET_ID
    ) ?: AppWidgetManager.INVALID_APPWIDGET_ID
    setResult(RESULT_OK, Intent().putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId))
    startActivity(
      Intent(Intent.ACTION_VIEW, Uri.parse("${DEEP_LINK}"))
        .setPackage(packageName)
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    )
    finish()
  }
}
`;

const withConfigureActivityManifest = (config) =>
  withAndroidManifest(config, (config) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(
      config.modResults
    );
    app.activity = app.activity ?? [];
    const name = `.${ACTIVITY}`;
    if (!app.activity.some((a) => a.$["android:name"] === name)) {
      app.activity.push({
        $: {
          "android:name": name,
          "android:exported": "true",
          "android:excludeFromRecents": "true",
          "android:noHistory": "true",
          "android:theme": "@android:style/Theme.Translucent.NoTitleBar",
        },
        "intent-filter": [
          {
            action: [
              {
                $: {
                  "android:name": "android.appwidget.action.APPWIDGET_CONFIGURE",
                },
              },
            ],
          },
        ],
      });
    }
    return config;
  });

const withConfigureActivityFiles = (config) =>
  withDangerousMod(config, [
    "android",
    async (config) => {
      const androidPackage = config.android?.package;
      if (!androidPackage) {
        throw new Error("with-widget-configure: android.package is required");
      }
      const root = config.modRequest.platformProjectRoot;

      const javaDir = path.join(
        root,
        "app/src/main/java",
        ...androidPackage.split(".")
      );
      fs.mkdirSync(javaDir, { recursive: true });
      fs.writeFileSync(
        path.join(javaDir, `${ACTIVITY}.kt`),
        activitySource(androidPackage)
      );

      const xmlDir = path.join(root, "app/src/main/res/xml");
      if (fs.existsSync(xmlDir)) {
        for (const file of fs.readdirSync(xmlDir)) {
          const xmlPath = path.join(xmlDir, file);
          const xml = fs.readFileSync(xmlPath, "utf8");
          if (
            !xml.includes("<appwidget-provider") ||
            xml.includes("android:configure=")
          ) {
            continue;
          }
          fs.writeFileSync(
            xmlPath,
            xml.replace(
              'android:widgetCategory="home_screen"',
              'android:widgetCategory="home_screen"\n' +
                `  android:configure="${androidPackage}.${ACTIVITY}"\n` +
                '  android:widgetFeatures="reconfigurable|configuration_optional"'
            )
          );
        }
      }
      return config;
    },
  ]);

module.exports = (config) =>
  withConfigureActivityFiles(withConfigureActivityManifest(config));
