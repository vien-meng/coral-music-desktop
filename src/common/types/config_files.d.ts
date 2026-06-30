declare namespace Coral {
  namespace ConfigFile {
    interface MyListInfoPart {
      type: 'playListPart_v2';
      data:
        | Coral.List.MyDefaultListInfoFull
        | Coral.List.MyLoveListInfoFull
        | Coral.List.UserListInfoFull;
    }
  }
}
