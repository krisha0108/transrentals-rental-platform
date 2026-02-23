import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { getBookings } from '../../../api/client';
import { useInfiniteScroll } from '../../../../hooks/useInfiniteScroll';
import DateFilterModal from '../../../../components/DateFilterModal';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const C = { bg:'#F7FAFC', surface:'#FFFFFF', text:'#1E293B', subtext:'#475569', muted:'#94A3B8', border:'#E2E8F0', brand:'#3B82F6', green:'#10B981', orange:'#F59E0B', red:'#EF4444', purple:'#8B5CF6' };

const STATUS_CONFIG = {
  PENDING_PAYMENT:  { label:'Payment Pending',   color:C.orange },
  PAYMENT_VERIFIED: { label:'Payment Verified',  color:C.green  },
  BROADCASTED:      { label:'Open',              color:C.brand  },
  PENDING_VENDOR:   { label:'Pending',           color:C.orange },
  ACCEPTED:         { label:'Accepted',          color:C.green  },
  CONFIRMED:        { label:'Confirmed',         color:C.green  },
  READY_FOR_PICKUP: { label:'Ready for Pickup',  color:'#0891B2'},
  IN_PROGRESS:      { label:'In Progress',       color:C.purple },
  COMPLETED:        { label:'Completed',         color:'#059669'},
  CANCELLED:        { label:'Cancelled',         color:C.red    },
};

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '--';

export default function BikeBookingsScreen({ navigation, route }) {
  const { filter } = route.params || {};
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('active');
  const [expandedId, setExpandedId] = useState(null);

  const { data:allBookings, loading, refreshing, hasMore, loadMore, refresh, initialLoad, applyDateFilter, dateFilter } =
    useInfiniteScroll(getBookings, { service:'bike', type:filter });

  useEffect(() => { initialLoad(); }, [initialLoad]);

  const bookings = selectedFilter === 'completed'
    ? allBookings.filter(b => b.status === 'COMPLETED')
    : allBookings.filter(b => b.status !== 'COMPLETED');

  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(prev => prev === id ? null : id);
  };

  const renderBooking = ({ item }) => {
    const sc = STATUS_CONFIG[item.status] || { label:item.status, color:C.muted };
    const isExpanded = expandedId === item.id;
    return (
      <View style={s.card}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('BikeBookingDetail',{bookingId:item.id,serviceType:'bike'})}>
          <View style={s.cardTop}>
            <View style={s.cardTopLeft}>
              <Text style={s.num}>#{item.bookingNumber}</Text>
              {item.totalDays && <Text style={s.chip}>{item.totalDays}d rental</Text>}
            </View>
            <View style={[s.badge,{backgroundColor:sc.color+'20'}]}><Text style={[s.badgeText,{color:sc.color}]}>{sc.label}</Text></View>
          </View>
          <View style={s.body}>
            <View style={s.row}><Icon name="user" size={14} color={C.muted}/><Text style={s.rowText} numberOfLines={1}>{item.customerName}</Text></View>
            <View style={s.row}><Icon name="map-pin" size={14} color={C.muted}/><Text style={s.rowText} numberOfLines={1}>{item.locationName||item.pickupCity||'N/A'}</Text></View>
            <View style={s.row}><Icon name="calendar" size={14} color={C.muted}/><Text style={s.rowText}>{fmt(item.pickupDate)}{item.pickupTime?`  ${item.pickupTime.slice(0,5)}`:''}</Text></View>
            {item.vehicleName && <View style={s.row}><Icon name="zap" size={14} color={C.muted}/><Text style={[s.rowText,{color:C.subtext}]} numberOfLines={1}>{item.vehicleName}</Text></View>}
          </View>
          <View style={s.footer}>
            <View><Text style={s.amtLabel}>Total Amount</Text><Text style={s.amt}>₹{(item.grandTotal||item.totalAmount||0).toLocaleString('en-IN')}</Text></View>
            <View style={s.footerRight}>
              <TouchableOpacity style={s.expandBtn} onPress={()=>toggleExpand(item.id)} hitSlop={{top:8,bottom:8,left:8,right:8}}>
                <Icon name={isExpanded?'chevron-up':'chevron-down'} size={16} color={C.muted}/>
              </TouchableOpacity>
              <Icon name="chevron-right" size={18} color={C.brand}/>
            </View>
          </View>
        </TouchableOpacity>
        {isExpanded && (
          <View style={s.expanded}>
            <View style={s.expandDivider}/>
            {item.vehicleBrand && <View style={s.eRow}><Icon name="zap" size={13} color={C.muted}/><Text style={s.eLabel}>Brand</Text><Text style={s.eVal}>{item.vehicleBrand}</Text></View>}
            {item.pickupAddress && <View style={s.eRow}><Icon name="map-pin" size={13} color={C.green}/><Text style={s.eLabel}>Pickup Addr.</Text><Text style={s.eVal}>{item.pickupAddress}</Text></View>}
            {item.dropDate && <View style={s.eRow}><Icon name="calendar" size={13} color={C.muted}/><Text style={s.eLabel}>Drop Date</Text><Text style={s.eVal}>{fmt(item.dropDate)}{item.dropTime?`  ${item.dropTime.slice(0,5)}`:''}</Text></View>}
            {item.securityDeposit > 0 && <View style={s.eRow}><Icon name="shield" size={13} color={C.muted}/><Text style={s.eLabel}>Security Dep.</Text><Text style={s.eVal}>₹{(item.securityDeposit||0).toLocaleString('en-IN')}</Text></View>}
            {item.dailyRate && <View style={s.eRow}><Icon name="tag" size={13} color={C.muted}/><Text style={s.eLabel}>Daily Rate</Text><Text style={s.eVal}>₹{item.dailyRate}/day</Text></View>}
            {item.customerNotes && <View style={[s.eRow,{alignItems:'flex-start'}]}><Icon name="file-text" size={13} color={C.muted}/><Text style={s.eLabel}>Notes</Text><Text style={[s.eVal,{flex:1}]}>{item.customerNotes}</Text></View>}
            <TouchableOpacity style={s.viewBtn} onPress={()=>navigation.navigate('BikeBookingDetail',{bookingId:item.id,serviceType:'bike'})}>
              <Text style={s.viewBtnText}>View Full Details</Text><Icon name="arrow-right" size={14} color={C.brand}/>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={()=>navigation.goBack()} style={s.backBtn}><Icon name="arrow-left" size={22} color={C.text}/></TouchableOpacity>
        <Text style={s.headerTitle}>Bike Bookings</Text>
        <TouchableOpacity onPress={()=>setShowDateFilter(true)} style={s.filterBtn}>
          <Icon name="calendar" size={20} color={dateFilter.start?C.brand:C.muted}/>
          {dateFilter.start && <View style={s.filterDot}/>}
        </TouchableOpacity>
      </View>
      {/* Active / Completed tabs */}
      <View style={s.tabs}>
        {['active','completed'].map(f=>(
          <TouchableOpacity key={f} style={[s.tab, selectedFilter===f && s.tabActive]} onPress={()=>setSelectedFilter(f)}>
            <Icon name={f==='active'?'activity':'check-circle'} size={15} color={selectedFilter===f?'#fff':C.muted}/>
            <Text style={[s.tabText, selectedFilter===f && s.tabTextActive]}>{f==='active'?'Active':'Completed'}</Text>
            <View style={[s.tabBadge, selectedFilter===f && s.tabBadgeActive]}>
              <Text style={[s.tabBadgeText, selectedFilter===f && s.tabBadgeTextActive]}>
                {f==='active'?allBookings.filter(b=>b.status!=='COMPLETED').length:allBookings.filter(b=>b.status==='COMPLETED').length}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
      {loading && allBookings.length===0 ? (
        <View style={s.centered}><ActivityIndicator size="large" color={C.brand}/></View>
      ) : (
        <FlatList data={bookings} renderItem={renderBooking} keyExtractor={i=>i.id} contentContainerStyle={s.list}
          onEndReached={loadMore} onEndReachedThreshold={0.5}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[C.brand]}/>}
          ListFooterComponent={loading&&hasMore?<View style={{paddingVertical:20}}><ActivityIndicator size="small" color={C.brand}/></View>:null}
          ListEmptyComponent={<View style={s.empty}><Icon name="inbox" size={48} color={C.muted}/><Text style={s.emptyTitle}>{selectedFilter==='completed'?'No completed bookings':'No active bookings'}</Text></View>}
        />
      )}
      <DateFilterModal visible={showDateFilter} onClose={()=>setShowDateFilter(false)} onApply={(st,e,t)=>applyDateFilter(st,e,t)} currentStartDate={dateFilter.start} currentEndDate={dateFilter.end} currentFilterType={dateFilter.type}/>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:C.bg}, centered:{flex:1,justifyContent:'center',alignItems:'center'},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingVertical:12,backgroundColor:C.surface,borderBottomWidth:1,borderBottomColor:C.border},
  backBtn:{width:40,height:40,justifyContent:'center',alignItems:'center'}, headerTitle:{fontSize:18,fontWeight:'600',color:C.text},
  filterBtn:{width:40,height:40,justifyContent:'center',alignItems:'center',position:'relative'},
  filterDot:{position:'absolute',top:8,right:8,width:8,height:8,borderRadius:4,backgroundColor:C.brand},
  tabs:{flexDirection:'row',gap:12,paddingHorizontal:16,paddingVertical:12,backgroundColor:C.surface,borderBottomWidth:1,borderBottomColor:C.border},
  tab:{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7,paddingVertical:11,backgroundColor:'#F1F5F9',borderRadius:12,borderWidth:1,borderColor:C.border},
  tabActive:{backgroundColor:C.brand,borderColor:C.brand},
  tabText:{fontSize:14,fontWeight:'600',color:C.muted}, tabTextActive:{color:'#fff'},
  tabBadge:{minWidth:22,height:22,backgroundColor:'#fff',borderRadius:11,paddingHorizontal:6,justifyContent:'center',alignItems:'center'},
  tabBadgeActive:{backgroundColor:'rgba(255,255,255,0.3)'},
  tabBadgeText:{fontSize:12,fontWeight:'700',color:C.brand}, tabBadgeTextActive:{color:'#fff'},
  list:{padding:16,gap:12},
  card:{backgroundColor:C.surface,borderRadius:14,borderWidth:1,borderColor:C.border,overflow:'hidden'},
  cardTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',paddingHorizontal:14,paddingTop:14,paddingBottom:10},
  cardTopLeft:{flexDirection:'row',alignItems:'center',gap:8,flex:1},
  num:{fontSize:15,fontWeight:'700',color:C.text},
  chip:{fontSize:11,color:C.brand,backgroundColor:'#EFF6FF',paddingHorizontal:7,paddingVertical:2,borderRadius:6,fontWeight:'600'},
  badge:{paddingHorizontal:10,paddingVertical:4,borderRadius:12}, badgeText:{fontSize:11,fontWeight:'700'},
  body:{paddingHorizontal:14,gap:8},
  row:{flexDirection:'row',alignItems:'center',gap:6}, rowText:{fontSize:13,color:C.subtext,flex:1},
  footer:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:14,paddingVertical:12,marginTop:6,borderTopWidth:1,borderTopColor:C.border},
  amtLabel:{fontSize:11,color:C.muted,marginBottom:1}, amt:{fontSize:17,fontWeight:'800',color:C.brand},
  footerRight:{flexDirection:'row',alignItems:'center',gap:10}, expandBtn:{padding:4},
  expanded:{paddingHorizontal:14,paddingBottom:14},
  expandDivider:{height:1,backgroundColor:C.border,marginBottom:10},
  eRow:{flexDirection:'row',alignItems:'center',gap:7,paddingVertical:5},
  eLabel:{fontSize:12,color:C.muted,width:76}, eVal:{fontSize:13,color:C.text,fontWeight:'500',flex:1},
  viewBtn:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,marginTop:10,paddingVertical:9,borderRadius:8,backgroundColor:'#EFF6FF'},
  viewBtnText:{fontSize:13,fontWeight:'700',color:C.brand},
  empty:{alignItems:'center',justifyContent:'center',paddingVertical:72,gap:8},
  emptyTitle:{fontSize:16,fontWeight:'600',color:C.text},
});
