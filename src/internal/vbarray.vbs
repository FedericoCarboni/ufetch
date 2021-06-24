Function ufetch_VBArrayToString(Bytes)
  ufetch_VBArrayToString = CStr(Bytes)
End Function
Function ufetch_VBArrayToStringLastChar(Bytes)
  Dim LastIndex
  LastIndex = LenB(Bytes)
  If LastIndex Mod 2 Then
    ufetch_VBArrayToStringLastChar = Chr(AscB(MidB(Bytes, LastIndex, 1)))
  Else
    ufetch_VBArrayToStringLastChar = ""
  End If
End Function
