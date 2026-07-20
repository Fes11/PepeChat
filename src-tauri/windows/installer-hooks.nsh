; Tauri's NSIS updater deliberately keeps existing shortcuts untouched.
; Recreate shortcuts so Windows notices a changed app icon.
!macro NSIS_HOOK_POSTINSTALL
  ; A versioned path is intentional: Explorer caches icons by their source path
  ; and can keep showing the previous executable icon even after reinstalling.
  SetOutPath "$INSTDIR"
  File /oname=${PRODUCTNAME}-${VERSION}.ico "${INSTALLERICON}"

  Delete "$DESKTOP\${PRODUCTNAME}.lnk"
  CreateShortcut "$DESKTOP\${PRODUCTNAME}.lnk" "$INSTDIR\${MAINBINARYNAME}.exe" "" "$INSTDIR\${PRODUCTNAME}-${VERSION}.ico" 0
  !insertmacro SetLnkAppUserModelId "$DESKTOP\${PRODUCTNAME}.lnk"

  !if "${STARTMENUFOLDER}" != ""
    ${If} ${FileExists} "$SMPROGRAMS\$AppStartMenuFolder\${PRODUCTNAME}.lnk"
      Delete "$SMPROGRAMS\$AppStartMenuFolder\${PRODUCTNAME}.lnk"
      CreateShortcut "$SMPROGRAMS\$AppStartMenuFolder\${PRODUCTNAME}.lnk" "$INSTDIR\${MAINBINARYNAME}.exe" "" "$INSTDIR\${PRODUCTNAME}-${VERSION}.ico" 0
      !insertmacro SetLnkAppUserModelId "$SMPROGRAMS\$AppStartMenuFolder\${PRODUCTNAME}.lnk"
    ${EndIf}
  !else
    ${If} ${FileExists} "$SMPROGRAMS\${PRODUCTNAME}.lnk"
      Delete "$SMPROGRAMS\${PRODUCTNAME}.lnk"
      CreateShortcut "$SMPROGRAMS\${PRODUCTNAME}.lnk" "$INSTDIR\${MAINBINARYNAME}.exe" "" "$INSTDIR\${PRODUCTNAME}-${VERSION}.ico" 0
      !insertmacro SetLnkAppUserModelId "$SMPROGRAMS\${PRODUCTNAME}.lnk"
    ${EndIf}
  !endif

  ; Tell Explorer to invalidate its shell icon/association view immediately.
  System::Call 'shell32::SHChangeNotify(i, i, p, p) (0x08000000, 0x1000, 0, 0)'
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  Delete "$INSTDIR\${PRODUCTNAME}-*.ico"
!macroend
