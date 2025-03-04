![{CCE40EEF-99AE-4760-9099-CAF31268E68D}](https://github.com/user-attachments/assets/b0c90af5-1ed4-4bb8-b80d-df172ce0028f)

# Steam Workshop Exporter for Space Engineers

A Tampermonkey script that helps you export your Steam Workshop subscriptions in a format compatible with Space Engineers server configuration.

## What This Script Does

This tool allows you to:
- Export your Steam Workshop subscriptions in XML format compatible with Space Engineers
- Select which mods you want to include in your export
- Search and filter your mod list
- Export as XML (for Sandbox.sbc files) or CSV (for reference)
- Copy directly to clipboard or download as a file

## Installation

1. Install the [Tampermonkey](https://www.tampermonkey.net/) browser extension:
   - [Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   - [Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
   - [Edge](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)

2. Create a new script in Tampermonkey:
   - Click on the Tampermonkey icon in your browser
   - Select "Create a new script"
   - Delete any default code
   - Paste the entire script code
   - Save (Ctrl+S or File → Save)

## How to Use

1. Navigate to your Steam Workshop subscriptions page:
   - Go to `https://steamcommunity.com/id/YOUR_STEAM_ID/myworkshopfiles/?appid=244850&browsesort=mysubscriptions`
   - Replace `YOUR_STEAM_ID` with your actual Steam ID

2. You'll see the "Workshop Exporter" widget in the top-right corner of the page

3. Export your mods:
   - Click "Show Mod List" to see all your subscribed mods
   - Use checkboxes to select/deselect individual mods
   - Use "Select All" or "Deselect All" for batch operations
   - Use the search box to filter by mod name or ID
   - Choose XML or CSV format from the dropdown
   - Click "Download" to save as a file, or "Copy to Clipboard" to copy the content

## Adding Mods to Your Space Engineers Server

Space Engineers stores mod information in the `Sandbox.sbc` file for each world/save. Here's how to add your exported mods:

### Method 1: Using an Existing Save

1. Locate your Space Engineers save folder:
   - Default location: `%AppData%\SpaceEngineers\Saves\[WORLD_NAME]`
   - Dedicated server: Check your server's save directory

2. Make a backup of your `Sandbox.sbc` file before editing

3. Open the `Sandbox.sbc` file in a text editor

4. Find the `<Mods>` section in the file. If it doesn't exist, you'll need to add it:
   ```xml
   <Mods>
     <!-- Your mod entries will go here -->
   </Mods>
   ```

5. Paste the exported mod entries inside the `<Mods>` tags

6. Save the file

### Method 2: Creating a New World with Mods

For a new dedicated server world:

1. Create a basic world first without mods

2. Stop the server

3. Edit the `Sandbox.sbc` file as described above

4. Restart the server

## Troubleshooting

- **Script doesn't appear**: Make sure you're on the correct Steam Workshop subscriptions page and have Tampermonkey enabled
- **No mods detected**: Try refreshing the page or check if you're logged into Steam properly
- **Server doesn't load mods**: Verify the mod IDs are correct and the mods are still available on the Workshop
- **Mod conflicts**: Some mods may be incompatible with each other; try identifying and removing problematic mods

## Notes

- The script formats the mods in the exact XML structure required by Space Engineers
- Each mod entry includes:
  - `FriendlyName`: The mod's display name
  - `Name`: The mod ID followed by `.sbm` extension
  - `PublishedFileId`: The Steam Workshop ID
  - `PublishedServiceName`: Always "Steam" for Workshop mods

## Example Sandbox.sbc Mods Section

```xml
<Mods>
  <ModItem FriendlyName="Rich HUD Master">
    <Name>1965654081.sbm</Name>
    <PublishedFileId>1965654081</PublishedFileId>
    <PublishedServiceName>Steam</PublishedServiceName>
  </ModItem>
  <ModItem FriendlyName="Previously Owned Economy Ships">
    <Name>3317449166.sbm</Name>
    <PublishedFileId>3317449166</PublishedFileId>
    <PublishedServiceName>Steam</PublishedServiceName>
  </ModItem>
</Mods>
```

## Important Reminders

- Always backup your save files before editing
- Keep track of which mods you're using for troubleshooting purposes
- All players connecting to your server will need to download the mods you've configured
- Some mods may require additional configuration beyond just adding them to Sandbox.sbc

## Credit

This tool was created to help Space Engineers players manage their mods more efficiently. Feel free to share and improve it!
