Function ufetch_vbs_0(B)
  ufetch_vbs_0 = CStr(B)
End Function
Function ufetch_vbs_1(B)
  Dim L
  L = LenB(B)
  If L Mod 2 Then
    ufetch_vbs_1 = Chr(AscB(MidB(B, L, 1)))
  Else
    ufetch_vbs_1 = ""
  End If
End Function
